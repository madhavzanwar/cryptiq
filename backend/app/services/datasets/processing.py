"""Raw Elliptic++ CSVs -> clean tables, time-based splits and graph features.

All graph computations use scipy sparse matrices (822k nodes / 2.8M edges fit in memory and run in
seconds; a NetworkX graph of that size would need several GB and minutes).

Label-leakage rules for graph features (tested in tests/test_leakage.py):
- only TRAIN-split labels are used ("y_train"); validation/test labels are treated as unknown;
- a wallet's own label never contributes to its own features (self is excluded explicitly).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components

from app.services.datasets.schema import (
    ADDRESS,
    CLASS,
    CLASS_TO_LABEL,
    EDGE_DST,
    EDGE_SRC,
    FEATURE_COLUMNS,
    TIME_STEP,
    TRAIN_MAX_STEP,
    VAL_MAX_STEP,
)

GRAPH_FEATURE_COLUMNS = [
    "pagerank", "comp_size", "in_deg", "out_deg",
    "nb1_illicit_train", "nb1_licit_train", "walk2_illicit_train", "walk2_licit_train",
    "hops_to_illicit_train",
]
HOPS_NONE = 3  # "3 or more / none" for hops_to_illicit_train


def read_raw(raw_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    feats = pd.read_csv(raw_dir / "wallets_features.csv", engine="pyarrow")
    classes = pd.read_csv(raw_dir / "wallets_classes.csv", engine="pyarrow")
    edges = pd.read_csv(raw_dir / "AddrAddr_edgelist.csv", engine="pyarrow")
    return feats, classes, edges


def check_schema(feats: pd.DataFrame, classes: pd.DataFrame, edges: pd.DataFrame) -> list[str]:
    """Return a list of problems (empty if the files match the documented schema)."""
    problems = []
    missing = {ADDRESS, TIME_STEP, *FEATURE_COLUMNS} - set(feats.columns)
    if missing:
        problems.append(f"wallets_features.csv missing columns: {sorted(missing)}")
    if {ADDRESS, CLASS} - set(classes.columns):
        problems.append("wallets_classes.csv needs columns address, class")
    elif not set(classes[CLASS].unique()) <= set(CLASS_TO_LABEL):
        problems.append(f"unexpected class codes: {sorted(classes[CLASS].unique())}")
    if {EDGE_SRC, EDGE_DST} - set(edges.columns):
        problems.append("AddrAddr_edgelist.csv needs columns input_address, output_address")
    return problems


def summarize(feats: pd.DataFrame, classes: pd.DataFrame, edges: pd.DataFrame) -> dict[str, Any]:
    deg = pd.concat([edges[EDGE_SRC], edges[EDGE_DST]]).value_counts()
    steps = feats[TIME_STEP]
    return {
        "wallets_features": {
            "rows": len(feats),
            "columns": list(feats.columns),
            "unique_addresses": int(feats[ADDRESS].nunique()),
            "exact_duplicate_rows": int(feats.duplicated().sum()),
            "time_step_min": int(steps.min()),
            "time_step_max": int(steps.max()),
            "rows_per_address_max": int(feats[ADDRESS].value_counts().max()),
            "features_vary_within_address": int(
                (feats.drop(columns=[TIME_STEP]).drop_duplicates()[ADDRESS].duplicated()).sum()),
        },
        "wallets_classes": {
            "rows": len(classes),
            "unique_addresses": int(classes[ADDRESS].nunique()),
            "class_counts": {str(k): int(v) for k, v in classes[CLASS].value_counts().sort_index().items()},
            "label_encoding": {str(k): v for k, v in CLASS_TO_LABEL.items()},
        },
        "AddrAddr_edgelist": {
            "rows": len(edges),
            "columns": list(edges.columns),
            "has_time_column": any("time" in c.lower() for c in edges.columns),
            "self_loops": int((edges[EDGE_SRC] == edges[EDGE_DST]).sum()),
            "duplicate_edges": int(edges.duplicated().sum()),
            "reciprocal_edges": _reciprocal(edges),
            "addresses_in_edges": int(deg.shape[0]),
            "max_degree": int(deg.max()),
            "degree_p50": float(deg.quantile(0.5)),
            "degree_p99": float(deg.quantile(0.99)),
            "nodes_with_degree_over_1000": int((deg > 1000).sum()),
            "edge_addresses_missing_from_classes": int((~deg.index.isin(classes[ADDRESS])).sum()),
        },
    }


def _reciprocal(edges: pd.DataFrame) -> int:
    e = edges[[EDGE_SRC, EDGE_DST]].drop_duplicates()
    e = e[e[EDGE_SRC] != e[EDGE_DST]]
    return int(pd.merge(e, e, left_on=[EDGE_SRC, EDGE_DST], right_on=[EDGE_DST, EDGE_SRC]).shape[0])


def build_wallets(feats: pd.DataFrame, classes: pd.DataFrame) -> pd.DataFrame:
    """One row per address: label, first/last time step and the features of its latest appearance."""
    f = feats.drop_duplicates()
    span = f.groupby(ADDRESS)[TIME_STEP].agg(first_step="min", last_step="max", n_appearances="nunique")
    latest = f.sort_values([ADDRESS, TIME_STEP]).drop_duplicates(ADDRESS, keep="last")
    latest = latest.set_index(ADDRESS)[FEATURE_COLUMNS]
    w = classes.drop_duplicates(ADDRESS).set_index(ADDRESS)
    w["label"] = w[CLASS].map(CLASS_TO_LABEL)
    out = w[["label"]].join(span, how="left").join(latest, how="left").reset_index()
    out[FEATURE_COLUMNS] = out[FEATURE_COLUMNS].astype("float32")
    return out


def assign_splits(wallets: pd.DataFrame, train_max: int = TRAIN_MAX_STEP, val_max: int = VAL_MAX_STEP
                  ) -> pd.DataFrame:
    """Time-based split on the first time step a wallet appears in."""
    step = wallets["first_step"].fillna(wallets["first_step"].max())
    split = np.where(step <= train_max, "train", np.where(step <= val_max, "val", "test"))
    return pd.DataFrame({ADDRESS: wallets[ADDRESS], "split": split, "first_step": wallets["first_step"]})


def build_edges(edges: pd.DataFrame, known: pd.Series) -> tuple[pd.DataFrame, dict[str, int]]:
    e = edges.rename(columns={EDGE_SRC: "src", EDGE_DST: "dst"})[["src", "dst"]]
    stats = {"raw": len(e)}
    e = e[e["src"] != e["dst"]]
    stats["after_self_loops"] = len(e)
    e = e.drop_duplicates()
    stats["after_dedupe"] = len(e)
    known_set = pd.Index(known)
    e = e[e["src"].isin(known_set) & e["dst"].isin(known_set)]
    stats["after_unknown_address_filter"] = len(e)
    return e.reset_index(drop=True), stats


@dataclass
class IndexedGraph:
    addresses: np.ndarray  # index -> address
    directed: sp.csr_matrix  # src -> dst, binary
    undirected: sp.csr_matrix  # symmetric, binary, zero diagonal


def index_graph(addresses: pd.Series, edges: pd.DataFrame) -> IndexedGraph:
    addr = addresses.to_numpy()
    idx = pd.Index(addr)
    s = idx.get_indexer(edges["src"])
    d = idx.get_indexer(edges["dst"])
    n = len(addr)
    data = np.ones(len(s), dtype=np.float32)
    directed = sp.csr_matrix((data, (s, d)), shape=(n, n))
    directed.data[:] = 1.0
    und = (directed + directed.T).tocsr()
    und.data[:] = 1.0
    und.setdiag(0)
    und.eliminate_zeros()
    return IndexedGraph(addr, directed, und)


def pagerank(directed: sp.csr_matrix, alpha: float = 0.85, tol: float = 1e-10, max_iter: int = 200
             ) -> np.ndarray:
    """Standard PageRank (power iteration, uniform teleport, dangling mass redistributed uniformly)."""
    n = directed.shape[0]
    out_deg = np.asarray(directed.sum(axis=1)).ravel()
    dangling = out_deg == 0
    inv = np.zeros(n)
    inv[~dangling] = 1.0 / out_deg[~dangling]
    transition_t = (sp.diags(inv) @ directed).T.tocsr()
    r = np.full(n, 1.0 / n)
    for _ in range(max_iter):
        r_new = alpha * (transition_t @ r + r[dangling].sum() / n) + (1 - alpha) / n
        if np.abs(r_new - r).sum() < tol:
            r = r_new
            break
        r = r_new
    out: np.ndarray = r / r.sum()
    return out


def graph_features(g: IndexedGraph, labels: pd.Series, splits: pd.Series) -> pd.DataFrame:
    """Per-wallet graph features. Label-derived ones use TRAIN labels only and exclude self.

    labels/splits are aligned with g.addresses.
    """
    a = g.undirected
    is_train = (splits.to_numpy() == "train")
    y_ill = ((labels.to_numpy() == "illicit") & is_train).astype(np.float64)
    y_lic = ((labels.to_numpy() == "licit") & is_train).astype(np.float64)
    deg = np.asarray(a.sum(axis=1)).ravel()

    # hop-1: distinct neighbours (diagonal is zero, so self is excluded)
    nb1_ill = a @ y_ill
    nb1_lic = a @ y_lic
    # 2-step walks ending at a train-labelled wallet, minus walks i->j->i that return to self
    walk2_ill = a @ nb1_ill - deg * y_ill
    walk2_lic = a @ nb1_lic - deg * y_lic
    # nearest OTHER train-illicit wallet: 1 if a neighbour is one; else 2 if a 2-walk reaches a
    # non-adjacent one (then its distance is exactly 2); else "3 or more / none"
    hops = np.full(len(deg), HOPS_NONE, dtype=np.int8)
    hops[walk2_ill > 0.5] = 2
    hops[nb1_ill > 0.5] = 1

    _n_comp, comp = connected_components(a, directed=False)
    comp_size = np.bincount(comp)[comp]
    return pd.DataFrame({
        ADDRESS: g.addresses,
        "pagerank": pagerank(g.directed).astype(np.float64),
        "comp_id": comp.astype(np.int64),
        "comp_size": comp_size.astype(np.int64),
        "in_deg": np.asarray(g.directed.sum(axis=0)).ravel().astype(np.int64),
        "out_deg": np.asarray(g.directed.sum(axis=1)).ravel().astype(np.int64),
        "nb1_illicit_train": nb1_ill.astype(np.int64),
        "nb1_licit_train": nb1_lic.astype(np.int64),
        "walk2_illicit_train": np.rint(walk2_ill).astype(np.int64),
        "walk2_licit_train": np.rint(walk2_lic).astype(np.int64),
        "hops_to_illicit_train": hops,
    })
