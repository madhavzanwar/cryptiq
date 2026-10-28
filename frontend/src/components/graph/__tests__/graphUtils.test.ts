import { describe, expect, it } from "vitest";
import type { GraphLink, GraphNode } from "@/lib/api/types";
import { FIXTURES } from "@/lib/mocks";
import {
  capNodes,
  filterByHop,
  hopCountRows,
  linkKey,
  maxHop,
  nodeShape,
  shortestPathToIllicit,
} from "../graphUtils";

const n = (id: string, hop: number, label: GraphNode["label"] = "unknown", isSubject = false): GraphNode => ({
  id,
  hop,
  label,
  ...(isSubject ? { isSubject } : {}),
});
const l = (source: string, target: string): GraphLink => ({ source, target });

const graph = {
  nodes: [
    n("S", 0, "unknown", true),
    n("a", 1, "licit"),
    n("b", 1, "unknown"),
    n("c", 2, "illicit"),
    n("d", 3, "illicit"),
  ],
  links: [l("S", "a"), l("b", "S"), l("a", "c"), l("c", "d")],
};

describe("nodeShape", () => {
  it("maps each label to a distinct shape", () => {
    expect(nodeShape("illicit")).toBe("diamond");
    expect(nodeShape("licit")).toBe("circle");
    expect(nodeShape("unknown")).toBe("hollow");
  });
});

describe("filterByHop", () => {
  it("keeps nodes up to the depth and only links between kept nodes", () => {
    const g = filterByHop(graph, 1);
    expect(g.nodes.map((x) => x.id)).toEqual(["S", "a", "b"]);
    expect(g.links).toHaveLength(2);
  });
  it("handles links whose ends were already resolved to objects", () => {
    const resolved = {
      nodes: graph.nodes,
      links: [{ source: { id: "S" }, target: { id: "a" } } as unknown as GraphLink],
    };
    expect(filterByHop(resolved, 1).links).toHaveLength(1);
  });
});

describe("capNodes", () => {
  it("does nothing under the cap", () => {
    expect(capNodes(graph, 10)).toMatchObject({ capped: false, total: 5 });
  });
  it("keeps the subject and the nearest nodes, flagged first within a hop", () => {
    const big = {
      nodes: [n("S", 0, "unknown", true), n("x1", 1, "licit"), n("x2", 1, "illicit"), n("y1", 2, "illicit")],
      links: [l("S", "x1"), l("S", "x2"), l("x2", "y1")],
    };
    const c = capNodes(big, 3);
    expect(c.capped).toBe(true);
    expect(c.total).toBe(4);
    expect(c.nodes.map((x) => x.id)).toEqual(["S", "x2", "x1"]);
    expect(c.links).toHaveLength(2);
  });
  it("caps a real fixture at 150 or less", () => {
    const f = FIXTURES["DEMO-ILLICIT-01"]!.subgraph;
    expect(capNodes(f, 150).nodes.length).toBeLessThanOrEqual(150);
  });
});

describe("shortestPathToIllicit", () => {
  it("finds the nearest illicit wallet over undirected links", () => {
    const p = shortestPathToIllicit(graph);
    expect(p?.nodeIds).toEqual(["S", "a", "c"]);
    expect(p?.hops).toBe(2);
    expect(p?.linkKeys.has(linkKey("c", "a"))).toBe(true);
  });
  it("returns null when no illicit wallet is reachable", () => {
    expect(
      shortestPathToIllicit({
        nodes: [n("S", 0, "unknown", true), n("a", 1, "licit")],
        links: [l("S", "a")],
      }),
    ).toBeNull();
  });
  it("ignores an illicit subject (distance to itself is not a path)", () => {
    expect(
      shortestPathToIllicit({
        nodes: [n("S", 0, "illicit", true), n("a", 1, "licit")],
        links: [l("S", "a")],
      }),
    ).toBeNull();
  });
  it("returns null without a subject", () => {
    expect(shortestPathToIllicit({ nodes: [n("a", 1, "illicit")], links: [] })).toBeNull();
  });
  it("agrees with the advertised distance on the BLOCK fixture", () => {
    const f = FIXTURES["DEMO-ILLICIT-01"]!;
    expect(shortestPathToIllicit(f.subgraph)?.hops).toBeLessThanOrEqual(f.hopsToNearestIllicit ?? 99);
  });
});

describe("maxHop and hopCountRows", () => {
  it("caps maxHop at 3", () => {
    expect(maxHop(graph)).toBe(3);
    expect(maxHop({ nodes: [n("S", 0, "unknown", true), n("z", 5)], links: [] })).toBe(3);
  });
  it("lists hop 3 only when present", () => {
    const c = { illicit: 1, licit: 2, unknown: 3 };
    expect(hopCountRows({ hop1: c, hop2: c })).toHaveLength(2);
    expect(hopCountRows({ hop1: c, hop2: c, hop3: c }).map((r) => r.hop)).toEqual([1, 2, 3]);
  });
});
