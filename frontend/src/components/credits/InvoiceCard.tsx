"use client";

import { Button, CodeBlock, Tag, type TagTone } from "@/components/ui";
import type { CryptoInvoice, InvoiceState } from "@/lib/api/types";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { formatCountdown } from "@/lib/pagesTime";
import { CircleCheck, Clock, TimerOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const STATUS: Record<InvoiceState, { key: MessageKey; tone: TagTone }> = {
  waiting: { key: "credits.crypto.waiting", tone: "bone" },
  paid: { key: "credits.crypto.paid", tone: "allow" },
  expired: { key: "credits.crypto.expired", tone: "unknown" },
};

/**
 * QR / invoice card: QR, payment URI (copyable), "Open in wallet", countdown and the three statuses.
 * Presentational: the polling lives in CryptoInvoice.
 */
export function InvoiceCard({
  invoice,
  status,
  remaining,
  onNew,
  onSimulate,
}: {
  invoice: CryptoInvoice;
  status: InvoiceState;
  /** Seconds until expiry. */
  remaining: number;
  onNew: () => void;
  /** Mock mode only. */
  onSimulate?: () => void;
}) {
  const { t } = useT();
  const s = STATUS[status];
  const Icon = status === "paid" ? CircleCheck : status === "expired" ? TimerOff : Clock;
  const live = status === "waiting";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] rounded-card border border-carbon bg-pure-white p-[var(--card-padding)] sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className={live ? "" : "opacity-40"}>
        <div role="img" aria-label={t("credits.crypto.qr")} className="w-fit rounded-tag border border-carbon bg-pure-white p-[18px] text-carbon">
          <QRCodeSVG value={invoice.uri} size={176} level="M" marginSize={0} bgColor="transparent" fgColor="currentColor" />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-[13px]">
        <p className="text-body-lg font-semibold">{t("credits.crypto.pay", { amount: invoice.amount, coin: invoice.coin.toUpperCase() })}</p>
        <p className="text-body text-ash-gray">{t("credits.crypto.scan")}</p>

        <div role="status" aria-live="polite" aria-label={t("credits.crypto.status")} className="flex flex-wrap items-center gap-[9px]">
          <Tag tone={s.tone}>
            <Icon className="size-4" aria-hidden />
            {t(s.key)}
          </Tag>
          {live && <span className="text-body tabular-nums">{t("credits.crypto.expires", { time: formatCountdown(remaining) })}</span>}
        </div>

        <div>
          <p className="mb-[4px] text-small text-ash-gray">{t("credits.crypto.uri")}</p>
          <CodeBlock code={invoice.uri} label={t("credits.crypto.uri")} />
        </div>

        {invoice.provider === "demo" && <p className="text-small text-ash-gray">{t("credits.crypto.demoNote")}</p>}

        <div className="flex flex-wrap items-center gap-[13px]">
          {live && (
            <a
              href={invoice.uri}
              className="inline-flex min-h-11 items-center justify-center rounded-button border border-carbon px-[18px] py-[13px] text-body transition-[background-color,color] duration-[120ms] ease-out hover:bg-carbon hover:text-pure-white"
            >
              {t("credits.crypto.open")}
            </a>
          )}
          {!live && (
            <Button variant="black" onClick={onNew}>
              {t("credits.crypto.new")}
            </Button>
          )}
          {live && onSimulate && (
            <Button variant="ghost" onClick={onSimulate}>
              {t("credits.crypto.simulate")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
