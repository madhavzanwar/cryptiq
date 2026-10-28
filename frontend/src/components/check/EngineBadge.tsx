"use client";

import { CodeBlock } from "@/components/ui/CodeBlock";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import type { CheckResponse } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import { Zap } from "lucide-react";
import { useId, useState } from "react";

/**
 * Which graph engine answered. The TigerGraph badge ("answered by TigerGraph in N ms", query name, View GSQL)
 * appears ONLY when the API says `engine === "tigergraph"`; mock data adds an "Example" tag. Any other engine
 * gets a neutral label, so we never claim a sponsor technology that did not run.
 */
export function EngineBadge({ result }: { result: CheckResponse }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const id = useId();
  const { engine, tigergraph, replay } = result;
  const ms = Math.round(tigergraph.ms);

  if (engine === "tigergraph") {
    return (
      <div className="flex flex-col gap-[9px]">
        <div className="flex flex-wrap items-center gap-x-[13px] gap-y-[7px] rounded-tag bg-powder-blue px-[13px] py-[9px] text-small" data-testid="tigergraph-badge">
          <Zap className="size-4 flex-none" aria-hidden />
          <span>{t("check.engine.tigergraph", { ms })}</span>
          <span className="mono text-small">{tigergraph.queryName}</span>
          {result.isMock && <Tag tone="white" className="py-[3px]">{t("check.engine.example")}</Tag>}
          {tigergraph.gsql && (
            <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="ml-auto min-h-11 underline underline-offset-4 sm:min-h-0">
              {open ? t("check.gsql.hide") : t("check.gsql.view")}
            </button>
          )}
        </div>
        {tigergraph.gsql && (
          <div id={id} className={cn(!open && "hidden")}>
            <CodeBlock code={tigergraph.gsql} label={t("check.gsql.label")} />
          </div>
        )}
      </div>
    );
  }

  const text = replay || engine === "replay" ? t("check.engine.replay") : engine === "networkx" ? t("check.engine.networkx", { ms }) : t("check.engine.other", { name: engine ?? tigergraph.queryName, ms });
  return (
    <div className="flex flex-wrap items-center gap-[9px]" data-testid="engine-label">
      <Tag tone="bone">
        <Zap className="size-4" aria-hidden />
        {text}
      </Tag>
    </div>
  );
}
