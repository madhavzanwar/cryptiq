"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useT } from "@/lib/i18n/provider";
import { HAS_WALLETCONNECT } from "@/lib/web3Config";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectUi() {
  const { t } = useT();
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        if (!connected) {
          return (
            <Button variant="black" onClick={openConnectModal} title={HAS_WALLETCONNECT ? undefined : t("web3.connect.noProject")}>
              {t("action.connectWallet")}
            </Button>
          );
        }
        if (chain.unsupported) {
          return (
            <Button variant="ghost" className="border-carbon!" onClick={openChainModal}>
              {t("web3.connect.wrongNetwork")}
            </Button>
          );
        }
        return (
          <div className="flex items-center gap-[9px]">
            <Tag tone="blue" className="max-sm:hidden">
              <span aria-hidden className="size-[7px] rounded-full bg-carbon" />
              {t("web3.connect.network")}
            </Tag>
            <Button variant="black" onClick={openAccountModal} aria-label={t("web3.connect.account", { address: account.displayName })}>
              <span className="mono text-body">{account.displayName}</span>
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
