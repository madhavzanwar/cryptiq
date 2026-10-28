"use client";

import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { shortAddress } from "@/lib/address/validate";
import { attestationUrl } from "@/lib/eas/rules";
import { useT } from "@/lib/i18n/provider";
import { useHistory } from "@/lib/stores/history";
import { CircleCheck, ExternalLink } from "lucide-react";
import { useState } from "react";

/** After a real attestation: UID with copy, link to easscan, and "Add to History". */
export function AttestSuccess({ uid, historyId }: { uid: string; historyId?: string }) {
  const { t } = useT();
  const setAttestation = useHistory((s) => s.setAttestation);
  const [added, setAdded] = useState(false);
  return (
    <div
      role="status"
      className="flex flex-col gap-[13px] rounded-card bg-allow-tint p-[18px] text-allow-ink"
    >
      <p className="flex items-center gap-[9px] font-semibold">
        <CircleCheck className="size-6 flex-none" aria-hidden strokeWidth={1.75} />
        {t("web3.success.title")}
      </p>
      <div className="flex flex-wrap items-center gap-[9px]">
        <span className="text-small">{t("web3.success.uid")}</span>
        <span className="mono text-small" title={uid}>
          {shortAddress(uid, 10, 8)}
        </span>
        <CopyButton value={uid} iconOnly className="text-carbon" />
      </div>
      <div className="flex flex-wrap gap-[9px]">
        <Button variant="ghost" href={attestationUrl(uid)} external className="border-carbon! bg-pure-white">
          {t("web3.success.view")}
          <ExternalLink className="size-4" aria-hidden />
        </Button>
        {historyId && (
          <Button
            variant="black"
            disabled={added}
            onClick={() => {
              setAttestation(historyId, uid);
              setAdded(true);
            }}
          >
            {added ? t("web3.success.historyDone") : t("web3.success.history")}
          </Button>
        )}
      </div>
    </div>
  );
}
