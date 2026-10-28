"use client";

import { Tag, type TagTone } from "@/components/ui/Tag";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/address/validate";
import { verifyReportHash } from "@/lib/api/reportHash";
import type { CheckResponse, NodeLabel } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { VERDICT_META } from "@/lib/verdict";
import { keccak256, toUtf8Bytes } from "ethers";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { EngineBadge } from "./EngineBadge";
import { ReasonsList } from "./ReasonsList";
import { RiskGauge } from "./RiskGauge";

const LABEL_TONE: Record<NodeLabel, TagTone> = { illicit: "block", licit: "allow", unknown: "unknown" };

function hashState(result: CheckResponse): "ok" | "bad" | "none" {
  if (result.reportHash === undefined) return "none";
  try {
    return verifyReportHash(result, (s) => keccak256(toUtf8Bytes(s))) ? "ok" : "bad";
  } catch {
    return "bad";
  }
}

function Notice({ tone, children }: { tone: "info" | "warn"; children: ReactNode }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  return (
    <p className={cn("flex items-start gap-[9px] rounded-tag px-[13px] py-[9px] text-small", tone === "warn" ? "bg-warn-tint text-warn-ink" : "bg-bone text-carbon")}>
      <Icon className="mt-[2px] size-4 flex-none" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/**
 * The verdict: icon + word, one honest wording line, risk meter, address, chips, graph-engine badge, reasons,
 * notices (mock / replay / cached / truncated) and the two permanent honesty lines.
 */
export function VerdictCard({ result, size = "md", className }: { result: CheckResponse; size?: "md" | "lg"; className?: string }) {
  const { t } = useT();
  const meta = VERDICT_META[result.verdict];
  const found = result.status === "ok";
  const hash = useMemo(() => hashState(result), [result]);
  const hops = result.hopsToNearestIllicit;
  const hopsTone: TagTone = hops === null ? "bone" : hops <= 1 ? "block" : hops === 2 ? "warn" : "bone";

  return (
    <section aria-label={t(meta.word)} className={cn("relative overflow-hidden rounded-card border border-carbon bg-pure-white p-[var(--card-padding)] pl-[calc(var(--card-padding)+4px)]", className)} data-verdict={result.verdict}>
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", meta.solid)} />
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col items-start gap-[11px]">
          <VerdictBadge verdict={result.verdict} size="lg" />
          <p className={cn(size === "lg" ? "text-subheading" : "text-body-lg")}>{t(meta.line)}</p>
        </div>

        <RiskGauge score={result.riskScore} verdict={result.verdict} size={size} />

        <div className="flex items-center gap-[7px]">
          <span className="mono text-small" title={result.address}>
            {shortAddress(result.address, 10, 8)}
          </span>
          <CopyButton value={result.address} iconOnly />
        </div>

        <div className="flex flex-wrap gap-[9px]">
          {result.datasetLabel && <Tag tone={LABEL_TONE[result.datasetLabel]}>{t("check.chip.dataset", { label: t(`check.label.${result.datasetLabel}` as const) })}</Tag>}
          {found && (
            <Tag tone={hopsTone}>
              {hops === null ? t("check.chip.hops.none") : t(hops === 1 ? "check.chip.hops.one" : "check.chip.hops.other", { n: hops })}
            </Tag>
          )}
          {(found || result.labelHits.ofac) && <Tag tone={result.labelHits.ofac ? "block" : "bone"}>{t(result.labelHits.ofac ? "check.chip.ofac.yes" : "check.chip.ofac.no")}</Tag>}
          {(found || result.labelHits.ransomwhere) && <Tag tone={result.labelHits.ransomwhere ? "block" : "bone"}>{t(result.labelHits.ransomwhere ? "check.chip.rw.yes" : "check.chip.rw.no")}</Tag>}
          {hash === "ok" && (
            <Tag tone="outline">
              <CircleCheck className="size-4" aria-hidden />
              {t("check.hash.ok")}
            </Tag>
          )}
          {hash === "bad" && (
            <Tag tone="warn">
              <CircleAlert className="size-4" aria-hidden />
              {t("check.hash.bad")}
            </Tag>
          )}
        </div>

        {found && <EngineBadge result={result} />}
        <ReasonsList reasons={result.topReasons} verdict={result.verdict} />

        {(result.isMock || result.replay || result.cached || result.truncated) && (
          <div className="grid gap-[7px]">
            {result.isMock && <Notice tone="warn">{t("check.notice.mock")}</Notice>}
            {result.replay && <Notice tone="info">{t("check.notice.replay")}</Notice>}
            {result.cached && <Notice tone="info">{t("check.notice.cached")}</Notice>}
            {result.truncated && <Notice tone="info">{t("check.notice.truncated")}</Notice>}
          </div>
        )}

        <p className="text-small text-ash-gray">
          {t("honesty.signal")} {t("honesty.dataset")}
        </p>
      </div>
    </section>
  );
}
