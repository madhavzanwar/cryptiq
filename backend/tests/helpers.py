"""Build a synthetic dataset + trained artifacts once per test session."""

from __future__ import annotations

from pathlib import Path

from scripts.build_processed import build
from scripts.make_fixture import make_fixture
from scripts.train import run as train_run


def build_trained_fixture(root: Path) -> tuple[Path, Path]:
    raw, processed, artifacts = root / "raw", root / "processed", root / "artifacts"
    make_fixture(raw, n_wallets=1500, seed=7)
    build(raw, processed, "synthetic_fixture")
    train_run(processed, artifacts, seed=42, warn=35, block=70)
    return processed, artifacts
