from __future__ import annotations

import json

from fastapi import APIRouter, Depends

from app.deps import get_state
from app.schemas.contract import DemoWallet, DemoWalletsResponse
from app.state import AppState

router = APIRouter()


@router.get("/api/demo-wallets", response_model=DemoWalletsResponse)
async def demo_wallets(state: AppState = Depends(get_state)) -> DemoWalletsResponse:
    """Held-out test-split wallets picked by scripts/export_demo_wallets.py (empty until trained)."""
    path = state.settings.artifacts_dir / "demo_wallets.json"
    if not path.exists():
        return DemoWalletsResponse(wallets=[])
    data = json.loads(path.read_text())
    return DemoWalletsResponse(wallets=[DemoWallet.model_validate(w) for w in data["wallets"]])
