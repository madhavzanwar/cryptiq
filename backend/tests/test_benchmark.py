from __future__ import annotations

import json
import shutil
import time
from pathlib import Path
from typing import Any

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.services.bench.runner import (
    BenchConfig,
    BudgetExceeded,
    graph_evidence,
    raw_dump,
    run_benchmark,
    sample_wallets,
)
from app.services.explain.llm import LLMResult
from app.services.graph.networkx_engine import NetworkXEngine
from app.services.model.scorer import Scorer


class CountingLLM:
    """Deterministic fake: BLOCK if the input mentions an illicit neighbour, else ALLOW."""

    provider = "fake"
    model = "fake-bench"

    def __init__(self) -> None:
        self.calls = 0
        self.inputs: list[str] = []

    async def complete(self, system: str, user: str, max_tokens: int = 400, temperature: float = 0.0) -> LLMResult:
        self.calls += 1
        self.inputs.append(user)
        flagged = "[illicit]" in user or '"illicit": 1' in user or '"illicit": 2' in user
        verdict = "BLOCK" if flagged else "ALLOW"
        return LLMResult(json.dumps({"verdict": verdict, "explanation": "x"}), len(user) // 3, 12, 1.0, self.model)

    async def aclose(self) -> None:
        return None


@pytest.fixture(scope="module")
def parts(trained: tuple[Path, Path]) -> tuple[Scorer, NetworkXEngine, pd.DataFrame]:
    processed, artifacts = trained
    return Scorer(artifacts, processed), NetworkXEngine(processed), pd.read_parquet(processed / "edges.parquet")


async def test_benchmark_records_real_measurements(parts: Any, tmp_path: Path) -> None:
    scorer, engine, edges = parts
    llm = CountingLLM()
    out = tmp_path / "bench.json"
    res = await run_benchmark(BenchConfig(sample_size=10), scorer, engine, edges, llm, 10_000_000, out, "synthetic_fixture")
    assert llm.calls == 20 and out.exists()
    assert res["sampleSize"] == 10 and res["seed"] == 1234 and "WARN or BLOCK" in res["mapping"]
    labels = {r["datasetLabel"] for r in res["records"]}
    assert labels == {"illicit", "licit"}  # stratified
    rows = {r["method"]: r for r in res["rows"]}
    assert set(rows) == {"raw_dump", "graph_evidence"}
    for r in res["records"]:
        for m in ("raw_dump", "graph_evidence"):
            assert r[m]["inputTokens"] is not None  # provider-reported (fake) usage, not an estimate
    raw_tokens = [r["raw_dump"]["inputTokens"] for r in res["records"]]
    assert rows["raw_dump"]["inputTokens"] == round(sum(raw_tokens) / len(raw_tokens), 1)


def test_own_label_is_hidden(parts: Any) -> None:
    scorer, engine, edges = parts
    addr = sample_wallets(scorer, 4, 1)[0]
    dump = raw_dump(addr, scorer, edges)
    assert f"{addr} [hidden]" in dump or addr in dump.splitlines()[0]
    assert f"{addr} [{scorer.label(addr)}]" not in dump
    ev = json.loads(graph_evidence(addr, engine, BenchConfig(4)))
    assert "datasetLabel" not in ev and "verdict" not in ev and "riskScore" not in ev


async def test_budget_guard(parts: Any, tmp_path: Path) -> None:
    scorer, engine, edges = parts
    llm = CountingLLM()
    with pytest.raises(BudgetExceeded):
        await run_benchmark(BenchConfig(sample_size=10), scorer, engine, edges, llm, 100, tmp_path / "b.json", "x")
    assert llm.calls == 0  # refused before any LLM call


def bench_client(settings: Any, trained: tuple[Path, Path], tmp_path: Path, **kw: Any) -> TestClient:
    from app.main import build_state, create_app

    processed, artifacts = trained
    art = tmp_path / "artifacts"
    shutil.copytree(artifacts, art, dirs_exist_ok=True)
    s = type(settings)(_env_file=None, **{**settings.model_dump(), "data_dir": processed.parent, "artifacts_dir": art, **kw})
    c = TestClient(create_app(s, build_state(s)))
    c.__enter__()
    return c


def test_get_benchmark_hides_fixture_numbers(settings: Any, trained: tuple[Path, Path], tmp_path: Path) -> None:
    c = bench_client(settings, trained, tmp_path)
    assert c.get("/api/benchmark").json() == {"status": "not_measured"}
    art = tmp_path / "artifacts"
    card = json.loads((art / "model_card.json").read_text())
    card["dataSource"] = "elliptic++"  # simulate a card trained on the real data
    (art / "model_card.json").write_text(json.dumps(card))
    body = c.get("/api/benchmark").json()
    assert body["status"] == "ok" and body["rows"] == [] and body["sampleSize"] == 0
    assert {m["name"] for m in body["models"]} == {"baseline", "with_graph_features"}


def test_run_endpoint(settings: Any, trained: tuple[Path, Path], tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    c = bench_client(settings, trained, tmp_path)
    assert c.post("/api/benchmark/run", json={"sampleSize": 10}).json() == {"error": "llm_unavailable"}
    assert c.post("/api/benchmark/run", json={"sampleSize": 500}).json() == {"error": "sample_size_above_cap_50"}
    import app.routers.benchmark as br

    monkeypatch.setattr(br, "build_llm", lambda s: CountingLLM())
    job = c.post("/api/benchmark/run", json={"sampleSize": 6}).json()["jobId"]
    for _ in range(100):
        st = c.get(f"/api/benchmark/job/{job}").json()
        if st["status"] != "running":
            break
        time.sleep(0.05)
    assert st == {"status": "done", "progress": 1.0}
    res = json.loads((tmp_path / "artifacts" / "benchmark_results.json").read_text())
    assert res["dataSource"] == "synthetic_fixture" and res["sampleSize"] == 6
    assert c.get("/api/benchmark").json() == {"status": "not_measured"}  # fixture results never surface
    assert c.get("/api/benchmark/job/nope").status_code == 404
