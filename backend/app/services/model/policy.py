"""Verdict policy. Thresholds come from model_card.json (chosen on validation)."""

from __future__ import annotations

from typing import Literal

Verdict = Literal["ALLOW", "WARN", "BLOCK", "UNKNOWN"]


def decide(score: int | None, in_dataset: bool, ofac_hit: bool, warn: int, block: int) -> Verdict:
    """OFAC match forces BLOCK (even outside the dataset); otherwise not-in-dataset -> UNKNOWN;
    otherwise ALLOW < warn <= WARN < block <= BLOCK."""
    if ofac_hit:
        return "BLOCK"
    if not in_dataset or score is None:
        return "UNKNOWN"
    if score >= block:
        return "BLOCK"
    if score >= warn:
        return "WARN"
    return "ALLOW"
