"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/provider";
import dynamic from "next/dynamic";
import { WalletSlot } from "./WalletSlot";

function Placeholder() {
  const { t } = useT();
  return (
    <Button variant="black" aria-busy="true" title={t("web3.connect.loading")}>
      {t("action.connectWallet")}
    </Button>
  );
}

// Rendered by the shared wallet host (inside wagmi/RainbowKit context) once it has loaded.
const ConnectUi = dynamic(() => import("./ConnectUi"), { ssr: false, loading: () => <Placeholder /> });

/**
 * Top-bar wallet control. Disconnected: "Connect wallet". Connected: Base Sepolia badge + short address.
 * Wrong network: "Switch to Base Sepolia". Contract: `<ConnectWalletButton />`.
 */
export function ConnectWalletButton() {
  return (
    <WalletSlot fallback={<Placeholder />}>
      <ConnectUi />
    </WalletSlot>
  );
}
