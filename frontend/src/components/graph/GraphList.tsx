"use client";

import type { GraphNode } from "@/lib/api/types";
import { shortAddress } from "@/lib/address/validate";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n";
import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { ShapeIcon } from "./GraphLegend";

const LABEL: Record<GraphNode["label"], MessageKey> = {
  illicit: "graph.legend.illicit",
  licit: "graph.legend.licit",
  unknown: "graph.legend.unknown",
};

/** "Graph as a list": the screen-reader friendly (and copy-friendly) version of the canvas. Collapsed by default. */
export function GraphList({ nodes }: { nodes: GraphNode[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const id = useId();
  const sorted = [...nodes].sort((a, b) => a.hop - b.hop || a.id.localeCompare(b.id));
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-[7px] rounded-button px-[9px] text-body transition-colors duration-[120ms] ease-out hover:bg-bone"
      >
        <ChevronRight
          aria-hidden
          className={cn("size-4 transition-transform duration-200 ease-emphasized", open && "rotate-90")}
        />
        {t("graph.list.toggle")}
        <span className="text-ash-gray">({nodes.length})</span>
      </button>
      <div
        id={id}
        hidden={!open}
        className="mt-[9px] max-h-[360px] overflow-auto rounded-card border border-carbon bg-pure-white"
      >
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">{t("graph.list.toggle")}</caption>
          <thead className="sticky top-0 bg-bone text-left text-small text-ash-gray">
            <tr>
              <th scope="col" className="px-[18px] py-[11px] font-medium">
                {t("graph.list.col.wallet")}
              </th>
              <th scope="col" className="px-[18px] py-[11px] font-medium">
                {t("graph.list.col.label")}
              </th>
              <th scope="col" className="px-[18px] py-[11px] text-right font-medium">
                {t("graph.list.col.hop")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((n) => (
              <tr key={n.id} className="border-t border-bone">
                <td className="px-[18px] py-[9px]">
                  <span className="mono text-small" title={n.id}>
                    {shortAddress(n.id, 8, 6)}
                  </span>
                  {n.isSubject && (
                    <span className="ml-[9px] text-small text-ash-gray">{t("graph.node.subject")}</span>
                  )}
                </td>
                <td className="px-[18px] py-[9px]">
                  <span className="inline-flex items-center gap-[7px]">
                    <ShapeIcon label={n.label} />
                    {t(LABEL[n.label])}
                  </span>
                </td>
                <td className="px-[18px] py-[9px] text-right tabular-nums">{n.hop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
