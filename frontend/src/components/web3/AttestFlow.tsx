"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import type { CheckResponse } from "@/lib/api/types";
import { shortAddress } from "@/lib/address/validate";
import { classifyAttestError, reportHashOf, type AttestErrorKind } from "@/lib/eas/rules";
import { EAS_CONTRACT, EAS_SCHEMA_UID } from "@/lib/env";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { CHAIN, HAS_WALLETCONNECT } from "@/lib/web3Config";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { AttestFrame } from "./AttestFrame";
import { AttestStepper } from "./AttestStepper";
import { AttestSuccess } from "./AttestSuccess";

const FAUCET_URL = "https://docs.base.org/base-chain/tools/network-faucets";

interface Props {
  result: CheckResponse;
  historyId?: string;
}

export default function AttestFlow({ result, historyId }: Props) {
  const { t } = useT();
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { data: walletClient } = useWalletClient({ chainId: CHAIN.id });
  const { openConnectModal } = useConnectModal();
  const [busy, setBusy] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: AttestErrorKind; key: MessageKey } | null>(null);

  const onRightChain = chainId === CHAIN.id;
  const step = uid ? 4 : !isConnected ? 0 : !onRightChain ? 1 : 2;
  const schemaMissing = EAS_SCHEMA_UID === "";
  const hash = reportHashOf(result);

  const fail = (e: unknown) => {
    const c = classifyAttestError(e);
    setError({ kind: c.kind, key: c.messageKey });
  };

  const switchNetwork = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: CHAIN.id });
    } catch (e) {
      fail(e);
    }
  };

  const sign = async () => {
    if (!walletClient || !address) return;
    setError(null);
    setBusy(true);
    try {
      // The signing code (ethers + EAS SDK) is only downloaded now, when the person actually signs.
      const [{ submitAttestation }, { clientToSigner }] = await Promise.all([import("@/lib/eas/attest"), import("@/lib/eas/signer")]);
      const newUid = await submitAttestation({ signer: clientToSigner(walletClient), contract: EAS_CONTRACT, schemaUid: EAS_SCHEMA_UID, recipient: address, result });
      setUid(newUid);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  let action: React.ReactNode = null;
  if (!uid) {
    if (step === 0) {
      action = (
        <Button variant="black" size="lg" className="self-start" onClick={openConnectModal}>
          {t("web3.button.connectFirst")}
        </Button>
      );
    } else if (step === 1) {
      action = (
        <Button variant="black" size="lg" className="self-start" loading={switching} onClick={switchNetwork}>
          {t("web3.button.switch")}
        </Button>
      );
    } else {
      action = (
        <Button variant="black" size="lg" className="self-start" loading={busy} disabled={schemaMissing || !walletClient} onClick={sign}>
          {busy ? t("web3.button.creating") : t("web3.button.create")}
        </Button>
      );
    }
  }

  return (
    <AttestFrame>
      <AttestStepper current={step} />
      <p className="sr-only" aria-live="polite">
        {uid ? t("web3.success.title") : ""}
      </p>
      {schemaMissing && <Alert tone="info">{t("web3.setup.schema")}</Alert>}
      {!HAS_WALLETCONNECT && step === 0 && <p className="text-small text-ash-gray">{t("web3.connect.noProject")}</p>}
      {error && (
        <Alert tone="error" action={error.kind === "insufficient_funds" ? <Button variant="ghost" href={FAUCET_URL} external>{t("web3.error.faucet")}</Button> : undefined}>
          {t(error.key)}
        </Alert>
      )}
      {uid ? <AttestSuccess uid={uid} historyId={historyId} /> : action}
      {hash && (
        <p className="flex flex-wrap items-center gap-[7px] text-small text-ash-gray">
          {t("web3.hash.label")}
          <span className="mono" title={hash}>
            {shortAddress(hash, 10, 8)}
          </span>
          <CopyButton value={hash} iconOnly />
        </p>
      )}
    </AttestFrame>
  );
}
