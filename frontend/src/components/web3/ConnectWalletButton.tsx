"use client";

import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/provider";

/** STUB (owned by the web3 agent): replaced by the RainbowKit connect button with the Base Sepolia badge. */
export function ConnectWalletButton() {
  const { t } = useT();
  return <Button variant="black">{t("action.connectWallet")}</Button>;
}
