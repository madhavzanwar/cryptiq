"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/provider";
import { useEffect, useRef, useState } from "react";
import { AttestFrame } from "./AttestFrame";
import { AttestStepper } from "./AttestStepper";

/**
 * Mock mode (NEXT_PUBLIC_USE_MOCKS=true): the whole flow is simulated on screen with a visible "Simulated"
 * badge. Nothing is sent anywhere, so there is no transaction, no UID and no explorer link, on purpose.
 */
export function SimulatedAttest() {
  const { t } = useT();
  const [phase, setPhase] = useState<"idle" | "working" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <AttestFrame simulated>
      <AttestStepper current={phase === "done" ? 4 : 2} />
      {phase === "done" ? (
        <Alert tone="success">{t("web3.simulated.done")}</Alert>
      ) : (
        <Button
          variant="black"
          size="lg"
          className="self-start"
          loading={phase === "working"}
          onClick={() => {
            setPhase("working");
            timer.current = window.setTimeout(() => setPhase("done"), 900);
          }}
        >
          {phase === "working" ? t("web3.button.creating") : t("web3.button.simulated")}
        </Button>
      )}
      <p className="text-small text-ash-gray">{t("web3.simulated.note")}</p>
    </AttestFrame>
  );
}
