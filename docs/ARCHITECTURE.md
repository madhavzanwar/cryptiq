# Cryptiq architecture

Say or paste a Bitcoin wallet. Cryptiq looks it up in a graph database, scores it, explains the result in English or Hindi, and can keep proof on-chain.
A risk signal, not an accusation. It runs on a research dataset (Elliptic++), not the live blockchain.

Sponsor technology is labelled **(sponsor)**. Everything else is open source or a free/test-mode service. Sponsor names are plain text, not endorsements.

## System

```mermaid
flowchart TB
  subgraph Browser["Browser (phone or laptop)"]
    UI["Next.js UI<br/>check, graph, credits, history"]
    MIC["Mic button<br/>MediaRecorder"]
    WSA["Web Speech API<br/>(voice fallback)"]
    WAL["Wallet<br/>RainbowKit + wagmi + viem"]
  end

  subgraph Vercel["Vercel: frontend/"]
    NEXT["Next.js app<br/>rewrite /api/* to BACKEND_URL<br/>same-origin session cookie"]
  end

  subgraph Fly["Fly.io: backend/ (FastAPI)"]
    API["REST + SSE<br/>/api/check, /api/transcribe, /api/credits ..."]
    PIPE["Pipeline<br/>validate, credit gate, cache, graph,<br/>score, verdict, reasons, explain"]
    MODEL["XGBoost risk model<br/>baseline vs graph features"]
    LEDGER[("SQLite<br/>sessions + credit ledger")]
  end

  subgraph Data["Graph and labels"]
    TG[("TigerGraph Savanna (sponsor)<br/>wallet graph, GSQL k-hop")]
    NX["NetworkX fallback engine<br/>labelled 'Offline engine' in the UI"]
    ELL[/"Elliptic++ research dataset<br/>822,942 wallets, 2,868,964 edges"/]
    OFAC[/"OFAC sanctioned addresses"/]
  end

  subgraph Voice["Voice"]
    WISPR["Wispr Flow (sponsor)<br/>speech to text, needs a key"]
    SARVAM["Sarvam AI<br/>speech to text + text to speech, hi-IN"]
  end

  subgraph Pay["Credits and payments (test mode)"]
    DODO["Dodo Payments (sponsor)<br/>test checkout + webhook"]
    CAKE["Cake Wallet (sponsor)<br/>bitcoin: / monero: payment links and QR<br/>(not embedded)"]
    ESPLORA["Bitcoin testnet explorer<br/>invoice confirmation"]
  end

  LLM["LLM provider<br/>explains ONLY the evidence JSON"]

  subgraph Chain["Base Sepolia (testnet)"]
    EAS["Ethereum Attestation Service<br/>verdict attestation + reportHash"]
  end

  UI --> NEXT
  MIC --> NEXT
  UI -. "speech fallback" .-> WSA
  NEXT -->|"/api/*"| API
  API --> PIPE
  PIPE --> LEDGER
  PIPE --> TG
  PIPE -. "if TigerGraph is down" .-> NX
  TG --- ELL
  NX --- ELL
  PIPE --> OFAC
  PIPE --> MODEL
  PIPE --> LLM
  API -->|"/api/transcribe"| WISPR
  WISPR -. "no key / error" .-> SARVAM
  API -->|"TTS (hi-IN)"| SARVAM
  API -->|"/api/checkout"| DODO
  DODO -->|"webhook adds credits"| API
  API -->|"/api/crypto-invoice"| CAKE
  CAKE -. "pay by QR" .-> ESPLORA
  ESPLORA --> API
  WAL -->|"attest(schema, data)"| EAS
  UI -->|"Verify: recompute hash"| EAS
```

## One check, step by step

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant B as Browser (Next.js)
  participant F as FastAPI
  participant G as TigerGraph (sponsor)
  participant M as Model + labels
  participant L as LLM
  participant E as EAS (Base Sepolia)

  U->>B: holds the mic and speaks a wallet (or pastes it)
  B->>F: POST /api/transcribe (audio)
  F-->>B: text + detected address + provider (wispr, sarvam or browser)
  U->>B: confirms the address (mandatory step)
  B->>F: POST /api/check/stream
  F-->>B: SSE step: Validating address
  F->>G: k-hop query (GSQL)
  F-->>B: SSE step: Querying the graph
  G-->>F: neighbours, hops to nearest flagged wallet, PageRank
  F-->>B: SSE step: Measuring hops
  F->>M: features + OFAC / label hits
  M-->>F: risk score, verdict (ALLOW / WARN / BLOCK), reasons
  F-->>B: SSE step: Scoring risk
  F->>L: evidence JSON only
  L-->>F: grounded explanation (EN + HI)
  F-->>B: SSE result: CheckResponse (verdict, graph, explanation, reportHash)
  Note over B: credit meter drops by one (not for cached repeats)
  U->>B: taps Attest (optional)
  B->>E: attest(schema, subjectAddress, chain, riskScore, verdict, reportHash)
  E-->>B: attestation UID + easscan link
  U->>B: taps Verify
  B->>E: read attestation and compare with the recomputed hash
  B-->>U: Match
```

## Layers and trust

| Layer | Where | What it must never do |
|---|---|---|
| UI | `frontend/` (Vercel) | ask for or store a seed phrase or private key; show invented numbers; call ALLOW "safe" |
| API | `backend/` (Fly.io) | send anything but the evidence JSON to the LLM; charge for cached repeats |
| Graph | TigerGraph (sponsor), NetworkX fallback | claim TigerGraph answered when the fallback did |
| Chain | Base Sepolia **testnet** only | use real money, or present an attestation as a legal verdict |

The proxy is same-origin on purpose: the browser only talks to the frontend origin and Next.js forwards `/api/*` to `BACKEND_URL`,
so the `cryptiq_sid` session cookie stays first-party (credits and payments depend on it).

See also: `docs/api-contract.md` (the API), `docs/CREDITS.md` (third-party code and datasets), `frontend/DECISIONS.md`, `backend/DECISIONS.md`.
