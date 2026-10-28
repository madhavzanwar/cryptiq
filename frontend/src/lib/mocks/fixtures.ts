import { computeReportHash } from "@/lib/api/reportHash";
import type { CheckResponse, Counts, DemoWallet, GraphLink, GraphNode, NodeLabel, Verdict } from "@/lib/api/types";
import { keccak256, toUtf8Bytes } from "ethers";

/** Deterministic PRNG so the same address always draws the same graph. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashSeed = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

interface Spec {
  address: string;
  verdict: Verdict;
  status: CheckResponse["status"];
  riskScore: number | null;
  datasetLabel: NodeLabel | null;
  hops: number | null;
  hop1: Counts;
  hop2: Counts;
  hop3: Counts;
  ofac: boolean;
  pagerank: number;
  componentSize: number;
  reasons: string[];
  en: string;
  hi: string;
}

const SHOWN = { hop1: 14, hop2: 30, hop3: 34 };

function shown(counts: Counts, cap: number): NodeLabel[] {
  const total = counts.illicit + counts.licit + counts.unknown;
  const scale = total > cap ? cap / total : 1;
  const out: NodeLabel[] = [];
  (["illicit", "licit", "unknown"] as const).forEach((label) => {
    const n = counts[label] === 0 ? 0 : Math.max(1, Math.round(counts[label] * scale));
    for (let i = 0; i < n; i++) out.push(label);
  });
  return out.slice(0, cap);
}

function buildSubgraph(spec: Spec): CheckResponse["subgraph"] {
  if (spec.status === "not_in_dataset") return { nodes: [], links: [] };
  const rand = mulberry32(hashSeed(spec.address));
  const nodes: GraphNode[] = [
    { id: spec.address, label: spec.datasetLabel ?? "unknown", hop: 0, isSubject: true, ...(spec.riskScore !== null ? { riskScore: spec.riskScore } : {}) },
  ];
  const links: GraphLink[] = [];
  const byHop: GraphNode[][] = [[nodes[0] as GraphNode], [], [], []];
  const counts = [spec.hop1, spec.hop2, spec.hop3];
  const caps = [SHOWN.hop1, SHOWN.hop2, SHOWN.hop3];
  counts.forEach((c, i) => {
    const hop = i + 1;
    shown(c, caps[i] as number).forEach((label, k) => {
      const node: GraphNode = { id: `DEMO-N${hop}-${String(k + 1).padStart(2, "0")}-${hashSeed(spec.address + hop + k).toString(16).slice(0, 5)}`, label, hop };
      nodes.push(node);
      (byHop[hop] as GraphNode[]).push(node);
      const parents = byHop[hop - 1] as GraphNode[];
      const parent = parents[Math.floor(rand() * parents.length)] as GraphNode;
      const amountBtc = Math.round((0.01 + rand() * 4) * 1e4) / 1e4;
      links.push(rand() < 0.5 ? { source: parent.id, target: node.id, amountBtc } : { source: node.id, target: parent.id, amountBtc });
    });
  });
  // a few extra cross links so the graph is not a pure tree
  for (let i = 0; i < 6 && nodes.length > 8; i++) {
    const a = nodes[1 + Math.floor(rand() * (nodes.length - 1))] as GraphNode;
    const b = nodes[1 + Math.floor(rand() * (nodes.length - 1))] as GraphNode;
    if (a.id !== b.id && Math.abs(a.hop - b.hop) <= 1) links.push({ source: a.id, target: b.id });
  }
  // guarantee the nearest illicit wallet sits at the advertised distance
  if (spec.hops !== null && spec.hops >= 1) {
    const hasIt = nodes.some((n) => n.label === "illicit" && n.hop === spec.hops);
    const pool = byHop[spec.hops] as GraphNode[];
    if (!hasIt && pool[0]) pool[0].label = "illicit";
  }
  return { nodes, links };
}

const GSQL = `CREATE QUERY walletRisk_khop(VERTEX<Wallet> w, INT k = 3) FOR GRAPH Elliptic {
  // example text shown in mock mode only
  OrAccum @@seen; SetAccum<VERTEX> @@frontier;
  Start = {w};
  WHILE k > 0 DO
    Start = SELECT t FROM Start:s -(SENT_TO:e)- Wallet:t;
    k = k - 1;
  END;
  PRINT Start;
}`;

const LIMITS = ["Research dataset, not the live blockchain.", "Risk signal, not an accusation."];

function build(spec: Spec): CheckResponse {
  const base: CheckResponse = {
    isMock: true,
    status: spec.status,
    address: spec.address,
    chain: "bitcoin",
    verdict: spec.verdict,
    riskScore: spec.riskScore,
    datasetLabel: spec.datasetLabel,
    hopsToNearestIllicit: spec.hops,
    neighbors: { hop1: spec.hop1, hop2: spec.hop2, hop3: spec.hop3 },
    graphFeatures: spec.status === "ok" ? { pagerank: spec.pagerank, componentSize: spec.componentSize } : {},
    labelHits: { ofac: spec.ofac, ransomwhere: false },
    topReasons: spec.reasons,
    subgraph: buildSubgraph(spec),
    tigergraph: { queryName: "walletRisk_khop", ms: 18 + (hashSeed(spec.address) % 60), gsql: GSQL },
    model: { name: "xgboost+graph (mock)", illicitF1Test: null },
    explanation: { en: spec.en, hi: spec.hi },
    audioUrl: null,
    limitations: LIMITS,
    engine: "tigergraph",
  };
  base.reportHash = computeReportHash(base, (s) => keccak256(toUtf8Bytes(s)));
  return base;
}

const z: Counts = { illicit: 0, licit: 0, unknown: 0 };

export const FIXTURES: Record<string, CheckResponse> = {
  "DEMO-ILLICIT-01": build({
    address: "DEMO-ILLICIT-01", verdict: "BLOCK", status: "ok", riskScore: 91, datasetLabel: "unknown", hops: 1,
    hop1: { illicit: 2, licit: 4, unknown: 8 }, hop2: { illicit: 6, licit: 22, unknown: 61 }, hop3: { illicit: 12, licit: 70, unknown: 190 },
    ofac: true, pagerank: 0.0000124, componentSize: 5124,
    reasons: ["1 flagged wallet within 1 hop", "On the OFAC sanctions list", "Sits in a large connected cluster"],
    en: "This wallet sends money to 2 wallets the dataset marks as illicit, one hop away. It also matches the OFAC sanctions list. That is a strong risk signal. It is not an accusation, and the data is a research dataset, not the live blockchain.",
    hi: "यह वॉलेट डेटासेट में 'illicit' चिह्नित 2 वॉलेट से सिर्फ़ एक कदम दूर है। यह OFAC प्रतिबंध सूची से भी मेल खाता है। यह मज़बूत जोखिम संकेत है, आरोप नहीं। यह रिसर्च डेटासेट है, लाइव ब्लॉकचेन नहीं।",
  }),
  "DEMO-BORDERLINE-03": build({
    address: "DEMO-BORDERLINE-03", verdict: "WARN", status: "ok", riskScore: 52, datasetLabel: "unknown", hops: 2,
    hop1: { illicit: 0, licit: 6, unknown: 11 }, hop2: { illicit: 3, licit: 25, unknown: 48 }, hop3: { illicit: 9, licit: 61, unknown: 130 },
    ofac: false, pagerank: 0.0000031, componentSize: 1844,
    reasons: ["Nearest flagged wallet is 2 hops away", "Mixed neighbours: some flagged, many unknown"],
    en: "The nearest wallet the dataset marks as illicit is 2 hops away, with one wallet in between. Most neighbours are licit or unknown. That is a mixed picture, so we show a warning. It is a risk signal, not an accusation.",
    hi: "डेटासेट में 'illicit' चिह्नित सबसे पास का वॉलेट 2 कदम दूर है, बीच में एक वॉलेट है। ज़्यादातर पड़ोसी licit या unknown हैं। तस्वीर मिली-जुली है, इसलिए चेतावनी दिखाई है। यह जोखिम संकेत है, आरोप नहीं।",
  }),
  "DEMO-LICIT-02": build({
    address: "DEMO-LICIT-02", verdict: "ALLOW", status: "ok", riskScore: 8, datasetLabel: "licit", hops: null,
    hop1: { illicit: 0, licit: 9, unknown: 4 }, hop2: { illicit: 0, licit: 30, unknown: 40 }, hop3: { illicit: 0, licit: 80, unknown: 120 },
    ofac: false, pagerank: 0.0000009, componentSize: 311,
    reasons: ["No flagged wallet within 3 hops", "Dataset label: licit"],
    en: "The dataset labels this wallet as licit, and no wallet marked illicit appears within 3 hops. No strong risk signals found in the dataset. This is not a guarantee. It is based on a research dataset, not the live blockchain.",
    hi: "डेटासेट इस वॉलेट को licit मानता है और 3 कदम के भीतर कोई illicit वॉलेट नहीं है। डेटासेट में कोई बड़ा जोखिम संकेत नहीं मिला। यह गारंटी नहीं है। यह रिसर्च डेटासेट पर आधारित है, लाइव ब्लॉकचेन पर नहीं।",
  }),
  "DEMO-NOTFOUND-04": build({
    address: "DEMO-NOTFOUND-04", verdict: "UNKNOWN", status: "not_in_dataset", riskScore: null, datasetLabel: null, hops: null,
    hop1: z, hop2: z, hop3: z, ofac: false, pagerank: 0, componentSize: 0,
    reasons: [],
    en: "Insufficient evidence: this wallet is not in our research dataset, so we cannot say anything about it.",
    hi: "पर्याप्त सबूत नहीं: यह वॉलेट हमारे रिसर्च डेटासेट में नहीं है, इसलिए हम इसके बारे में कुछ नहीं कह सकते।",
  }),
};

export const DEMO_WALLETS: DemoWallet[] = [
  { address: "DEMO-ILLICIT-01", note: "Known illicit (demo)", expected: "BLOCK" },
  { address: "DEMO-BORDERLINE-03", note: "Borderline (demo)", expected: "WARN" },
  { address: "DEMO-LICIT-02", note: "Clean (demo)", expected: "ALLOW" },
  { address: "DEMO-NOTFOUND-04", note: "Not in dataset (demo)", expected: "UNKNOWN" },
];

/** Any other address that passes the format check is "not in the (mock) dataset". */
export function fixtureFor(address: string): CheckResponse {
  const known = FIXTURES[address.toUpperCase()];
  if (known) return known;
  return { ...(FIXTURES["DEMO-NOTFOUND-04"] as CheckResponse), address, subgraph: { nodes: [], links: [] } };
}
