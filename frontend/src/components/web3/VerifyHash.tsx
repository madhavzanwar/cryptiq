"use client";

import { Button } from "@/components/ui/Button";
import type { CheckResponse } from "@/lib/api/types";
import { keccakUtf8 } from "@/lib/eas/keccak";
import {
  checkLocalHash,
  classifyVerifyError,
  compareOnChain,
  type LocalHashCheck,
  type OnChainComparison,
  type VerifyErrorKind,
} from "@/lib/eas/verify";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { CircleCheck, CircleHelp, CircleX, TriangleAlert } from "lucide-react";
import { useState } from "react";

type ChainState = { kind: "done"; cmp: OnChainComparison } | { kind: "error"; error: VerifyErrorKind };

const FIELD_KEYS: Record<string, MessageKey> = {
  subjectAddress: "web3.verify.field.subjectAddress",
  chain: "web3.verify.field.chain",
  riskScore: "web3.verify.field.riskScore",
  verdict: "web3.verify.field.verdict",
  reportHash: "web3.verify.field.reportHash",
};

type Tone = "match" | "mismatch" | "warn" | "na";
const TONE: Record<Tone, { cls: string; Icon: typeof CircleCheck }> = {
  match: { cls: "bg-allow-tint text-allow-ink", Icon: CircleCheck },
  mismatch: { cls: "bg-block-tint text-block-ink", Icon: CircleX },
  warn: { cls: "bg-warn-tint text-warn-ink", Icon: TriangleAlert },
  na: { cls: "bg-unknown-tint text-unknown-ink", Icon: CircleHelp },
};

function Row({ label, tone, word, note }: { label: string; tone: Tone; word: string; note?: string }) {
  const { cls, Icon } = TONE[tone];
  return (
    <li className={`flex flex-col gap-1 rounded-card px-[18px] py-[11px] ${cls}`}>
      <span className="flex flex-wrap items-center justify-between gap-[9px]">
        <span className="text-small">{label}</span>
        <span className="inline-flex items-center gap-[7px] font-semibold">
          <Icon className="size-5" aria-hidden strokeWidth={1.75} />
          {word}
        </span>
      </span>
      {note && <span className="text-small">{note}</span>}
    </li>
  );
}

/**
 * "Verify": recomputes the report hash in the browser and compares it with the backend's hash. When the
 * attestation UID is known it also reads the attestation from Base Sepolia and compares address, chain, score,
 * verdict and hash. "Match" appears only after a real comparison; any failure to reach the chain says so.
 */
export function VerifyHash({ result, uid }: { result: CheckResponse; uid?: string }) {
  const { t } = useT();
  const [running, setRunning] = useState(false);
  const [local, setLocal] = useState<LocalHashCheck | null>(null);
  const [chain, setChain] = useState<ChainState | null>(null);

  const run = async () => {
    setRunning(true);
    setChain(null);
    setLocal(checkLocalHash(result, keccakUtf8));
    if (uid) {
      try {
        const { fetchAttestation } = await import("@/lib/eas/chain");
        const att = await fetchAttestation(uid);
        setChain({ kind: "done", cmp: compareOnChain(result, att.fields, keccakUtf8, { revoked: att.revoked }) });
      } catch (e) {
        setChain({ kind: "error", error: classifyVerifyError(e) });
      }
    }
    setRunning(false);
  };

  const localRow = (() => {
    if (!local) return null;
    if (local.outcome === "no_backend_hash")
      return <Row label={t("web3.verify.local")} tone="na" word={t("web3.verify.na")} note={t("web3.verify.noBackendHash")} />;
    return (
      <Row
        label={t("web3.verify.local")}
        tone={local.outcome === "match" ? "match" : "mismatch"}
        word={t(local.outcome === "match" ? "web3.verify.match" : "web3.verify.mismatch")}
      />
    );
  })();

  const chainRow = (() => {
    if (!chain) return null;
    if (chain.kind === "error") {
      const key: MessageKey =
        chain.error === "network" ? "web3.verify.network" : chain.error === "not_found" ? "web3.verify.notFound" : "web3.verify.other";
      return <Row label={t("web3.verify.chain")} tone="warn" word={t("web3.verify.na")} note={t(key)} />;
    }
    const { cmp } = chain;
    if (cmp.outcome === "match") return <Row label={t("web3.verify.chain")} tone="match" word={t("web3.verify.match")} />;
    if (cmp.outcome === "revoked")
      return <Row label={t("web3.verify.chain")} tone="warn" word={t("web3.verify.revoked")} note={t("web3.verify.revokedNote")} />;
    return (
      <Row
        label={t("web3.verify.chain")}
        tone="mismatch"
        word={t("web3.verify.mismatch")}
        note={t("web3.verify.different", { fields: cmp.mismatched.map((f) => t(FIELD_KEYS[f] as MessageKey)).join(", ") })}
      />
    );
  })();

  return (
    <div className="flex flex-col gap-[11px]">
      <div className="flex flex-wrap items-center gap-[13px]">
        <Button variant="ghost" loading={running} onClick={run}>
          {running ? t("web3.verify.running") : t("web3.verify.button")}
        </Button>
        {(local || chain) && <h4 className="text-small text-ash-gray">{t("web3.verify.heading")}</h4>}
      </div>
      <ul aria-live="polite" className="flex flex-col gap-[7px]">
        {localRow}
        {chainRow}
      </ul>
    </div>
  );
}
