"use client";

// TEMPORARY test page for agent B (graph + web3). Deleted before hand-off.
import { AttestPanel } from "@/components/web3/AttestPanel";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { EvidenceGraph } from "@/components/graph/EvidenceGraph";
import { Segmented } from "@/components/ui/Segmented";
import { api } from "@/lib/api/instance";
import type { CheckResponse } from "@/lib/api/types";
import { FIXTURES } from "@/lib/mocks";
import { useHistory } from "@/lib/stores/history";
import { useSettings } from "@/lib/stores/settings";
import { useEffect, useState } from "react";

const KEYS = ["DEMO-ILLICIT-01", "DEMO-BORDERLINE-03", "DEMO-LICIT-02", "DEMO-NOTFOUND-04", "REAL"] as const;

export default function GraphLab() {
  const [key, setKey] = useState<(typeof KEYS)[number]>("DEMO-ILLICIT-01");
  const [real, setReal] = useState<CheckResponse | null>(null);
  const [err, setErr] = useState("");
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const add = useHistory((s) => s.add);
  const [hid, setHid] = useState<string | undefined>();

  useEffect(() => {
    if (key !== "REAL" || real) return;
    void (async () => {
      try {
        const w = await api.demoWallets();
        setReal(await api.check(w.wallets[0]!.address, "en"));
      } catch (e) {
        setErr(String(e));
      }
    })();
  }, [key, real]);

  const result = key === "REAL" ? real : FIXTURES[key]!;
  useEffect(() => {
    setHid(result ? add(result).id : undefined);
  }, [result, add]);

  return (
    <div className="container-page flex flex-col gap-[26px] py-[35px]">
      <div className="flex flex-wrap items-center gap-[18px]">
        <h1 className="h-sm">graph-lab</h1>
        <ConnectWalletButton />
        <Segmented label="lang" value={lang} onChange={setLang} options={[{ value: "en", label: "EN" }, { value: "hi", label: "हिं", lang: "hi" }]} />
      </div>
      <Segmented label="fixture" value={key} onChange={setKey} options={KEYS.map((k) => ({ value: k, label: k.replace("DEMO-", "") }))} className="self-start" />
      {err && <p>{err}</p>}
      {result && (
        <div className="grid gap-[26px] lg:grid-cols-[7fr_5fr]">
          <div data-testid="graph"><EvidenceGraph result={result} /></div>
          <div data-testid="attest"><AttestPanel result={result} historyId={hid} /></div>
        </div>
      )}
    </div>
  );
}
