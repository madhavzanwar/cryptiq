"""FastAPI app factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import Settings, get_settings
from app.db.base import Database
from app.errors import install_error_handlers
from app.logging_setup import configure_logging, log
from app.middleware import RequestContextMiddleware
from app.ratelimit import limiter
from app.routers import health
from app.state import AppState


def build_state(settings: Settings) -> AppState:
    db = Database(settings.database_url)
    db.create_all()
    state = AppState(settings=settings, db=db)
    try:
        from app.services.pipeline import build_pipeline
    except ImportError:  # pipeline lands in a later phase
        return state
    state.pipeline = build_pipeline(settings, db)
    return state


def create_app(settings: Settings | None = None, state: AppState | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging("DEBUG" if settings.app_env == "dev" else "INFO")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if not hasattr(app.state, "cryptiq"):
            app.state.cryptiq = build_state(settings)
        log.info("startup", env=settings.app_env)
        yield
        p = app.state.cryptiq.pipeline
        if p is not None:
            await p.aclose()

    app = FastAPI(title="Cryptiq API", version="0.1.0", lifespan=lifespan,
                  docs_url="/api/docs" if settings.app_env != "prod" else None, redoc_url=None,
                  openapi_url="/api/openapi.json")
    if state is not None:
        app.state.cryptiq = state
    app.state.limiter = limiter
    limiter.enabled = settings.app_env != "test"
    install_error_handlers(app)
    app.add_exception_handler(RateLimitExceeded, app.exception_handlers[RateLimitExceeded])
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(RequestContextMiddleware, settings=settings)
    # CORS outermost so even errors carry CORS headers. Never "*" with credentials.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["content-type", "x-request-id", "x-admin-token"],
        expose_headers=["x-request-id"],
    )
    app.include_router(health.router)
    for name in ("demo", "check", "transcribe", "credits", "crypto", "benchmark", "webhooks", "audio"):
        try:
            module = __import__(f"app.routers.{name}", fromlist=["router"])
        except ModuleNotFoundError:
            continue
        app.include_router(module.router)
    return app


app = create_app()
