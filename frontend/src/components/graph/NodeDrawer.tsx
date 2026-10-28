"use client";

import { CopyButton } from "@/components/ui/CopyButton";
import { Drawer } from "@/components/ui/Drawer";
import { Tag, type TagTone } from "@/components/ui/Tag";
import type { GraphNode } from "@/lib/api/types";
import { shortAddress } from "@/lib/address/validate";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { ShapeIcon } from "./GraphLegend";

const TONE: Record<GraphNode["label"], TagTone> = { illicit: "block", licit: "allow", unknown: "unknown" };
const LABEL: Record<GraphNode["label"], MessageKey> = {
  illicit: "graph.legend.illicit",
  licit: "graph.legend.licit",
  unknown: "graph.legend.unknown",
};
const WHY: Record<GraphNode["label"], MessageKey> = {
  illicit: "graph.node.why.illicit",
  licit: "graph.node.why.licit",
  unknown: "graph.node.why.unknown",
};

/** Right-side details for a clicked wallet: short address, label, hop distance, why it matters. */
export function NodeDrawer({ node, onClose }: { node: GraphNode | null; onClose: () => void }) {
  const { t } = useT();
  return (
    <Drawer open={node !== null} onClose={onClose} title={t("graph.node.title")}>
      {node && (
        <div className="flex flex-col gap-[18px]">
          <div>
            <p className="text-small text-ash-gray">
              {node.isSubject ? t("graph.node.subject") : t("graph.list.col.wallet")}
            </p>
            <div className="flex items-center gap-[9px]">
              <span className="mono text-body-lg" title={node.id}>
                {shortAddress(node.id, 8, 8)}
              </span>
              <CopyButton value={node.id} iconOnly />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-[18px] gap-y-[11px] text-body-lg">
            <dt className="text-ash-gray">{t("graph.node.label")}</dt>
            <dd>
              <Tag tone={TONE[node.label]}>
                <ShapeIcon label={node.label} className="size-4" />
                {t(LABEL[node.label])}
              </Tag>
            </dd>
            <dt className="text-ash-gray">{t("graph.node.hop")}</dt>
            <dd>{node.hop}</dd>
            {node.riskScore !== undefined && (
              <>
                <dt className="text-ash-gray">{t("graph.node.risk")}</dt>
                <dd>{Math.round(node.riskScore)}</dd>
              </>
            )}
          </dl>
          <p className="measure text-ash-gray">
            {node.isSubject ? t("graph.node.why.subject") : t(WHY[node.label])}
          </p>
        </div>
      )}
    </Drawer>
  );
}
