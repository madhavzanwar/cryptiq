"use client";

import { useT } from "@/lib/i18n/provider";
import { usageShare } from "@/lib/pagesMoney";
import { formatTime } from "@/lib/pagesTime";
import { shortAddress } from "@/lib/address/validate";
import { useCredits } from "@/lib/stores/credits";

/** Usage meter (credits used this session) and the "Recent credit activity" table, both from the local store. */
export function UsageAndActivity() {
  const { t, lang } = useT();
  const activity = useCredits((s) => s.activity);
  const balance = useCredits((s) => s.balance);
  const { used, total, pct } = usageShare(activity, balance);

  return (
    <div className="grid gap-[35px]">
      <section aria-labelledby="usage-h">
        <h2 id="usage-h" className="sub mb-[13px]">{t("credits.usage.title")}</h2>
        <div role="meter" aria-label={t("credits.usage.aria")} aria-valuemin={0} aria-valuemax={Math.max(total, 1)} aria-valuenow={used} className="h-[13px] rounded-full border border-carbon bg-plaster">
          <div className="h-full rounded-full bg-carbon transition-[width] duration-[900ms] ease-emphasized" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-[9px] text-body text-ash-gray tabular-nums">{t("credits.usage.of", { used, total })}</p>
      </section>

      <section aria-labelledby="activity-h">
        <h2 id="activity-h" className="sub mb-[13px]">{t("credits.activity.title")}</h2>
        {activity.length === 0 ? (
          <p className="rounded-card border border-carbon bg-pure-white p-[26px] text-ash-gray">{t("credits.activity.empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-carbon bg-pure-white">
            <table className="w-full border-collapse text-body-lg">
              <caption className="sr-only">{t("credits.activity.title")}</caption>
              <thead>
                <tr className="bg-bone text-left text-small text-ash-gray">
                  <th scope="col" className="px-[18px] py-[13px] font-medium">{t("credits.activity.time")}</th>
                  <th scope="col" className="px-[18px] py-[13px] font-medium">{t("credits.activity.what")}</th>
                  <th scope="col" className="px-[18px] py-[13px] text-right font-medium">{t("credits.activity.delta")}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t border-bone">
                    <td className="p-[18px] whitespace-nowrap tabular-nums">{formatTime(a.at, lang)}</td>
                    <td className="p-[18px]">
                      {a.kind === "check" ? (
                        <>
                          {t("credits.activity.check", { address: "" })}
                          <span className="mono" title={a.note}>{shortAddress(a.note)}</span>
                        </>
                      ) : (
                        t("credits.activity.topup", { note: a.note })
                      )}
                    </td>
                    <td className="p-[18px] text-right font-semibold tabular-nums">{a.delta > 0 ? `+${a.delta}` : a.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
