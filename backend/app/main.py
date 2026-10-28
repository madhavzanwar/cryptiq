"""FastAPI app factory."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
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
from app.routers import audio, check, credits, crypto, demo, health, transcribe, webhooks
from app.services.pipeline import build_pipeline
from app.state import AppState


def build_state(settings: Settings) -> AppState:
    db = Database(settings.database_url)
    db.create_all()
    http = httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0))
    return AppState(settings=settings, db=db, pipeline=build_pipeline(settings, db, http=http), http=http)


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
        await app.state.cryptiq.http.aclose()

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
        allow_headers=["content-type", "x-request-id"],
        expose_headers=["x-request-id"],
    )
    for r in (health.router, demo.router, check.router, transcribe.router, audio.router, credits.router,
              crypto.router, webhooks.router):
        app.include_router(r)
    return app


app = create_app()
