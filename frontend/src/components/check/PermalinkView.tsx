"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { EvidenceGraph } from "@/components/graph/EvidenceGraph";
import { useT } from "@/lib/i18n/provider";
import { useHistory } from "@/lib/stores/history";
import { SearchX } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DetailsTabs } from "./DetailsTabs";
import { ExplanationPanel } from "./ExplanationPanel";
import { VerdictCard } from "./VerdictCard";

/**
 * /r/[id]: a read-only view of a stored result. Results live in this browser only (in memory for the tab, and on
 * disk only if the person turned History on), so a link opened elsewhere shows the friendly "not found" state.
 */
export function PermalinkView() {
  const { t, lang } = useT();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const entry = useHistory((s) => s.entries.find((e) => e.id === id));
  // Saved history is restored just after the first paint; give it a moment before saying "not found".
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!entry) {
    return (
      <div className="container-page section-gap">
        {waited ? (
          <EmptyState
            icon={<SearchX aria-hidden />}
            title={t("check.permalink.notFound.title")}
            action={<Button variant="green" size="lg" href="/check">{t("check.permalink.cta")}</Button>}
          >
            {t("check.permalink.notFound.body")}
          </EmptyState>
        ) : (
          <div aria-hidden className="grid gap-[18px]">
            <Skeleton className="h-[53px] w-[40%]" />
            <Skeleton className="h-[320px] rounded-card" />
          </div>
        )}
      </div>
    );
  }

  const { result } = entry;
  const when = new Date(entry.at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="container-page section-gap">
      <header className="mb-[42px] flex flex-col items-start gap-[9px]">
        <Tag tone="bone">{t("check.permalink.readonly")}</Tag>
        <h1 className="h-md">{t("check.permalink.title")}</h1>
        <p className="text-ash-gray">{t("check.permalink.checkedAt", { time: when })}</p>
      </header>
      <div className="grid items-start gap-[var(--grid-gap)] lg:grid-cols-12">
        <div className="lg:col-span-5">
          <VerdictCard result={result} />
        </div>
        <div className="flex flex-col gap-[var(--grid-gap)] lg:col-span-7">
          <EvidenceGraph result={result} />
          <ExplanationPanel result={result} />
          <DetailsTabs result={result} />
        </div>
      </div>
      <div className="mt-[53px]">
        <Button variant="green" size="lg" href="/check">
          {t("check.permalink.cta")}
        </Button>
      </div>
    </div>
  );
}
