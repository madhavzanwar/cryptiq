# Wallet and attestation setup (Base Sepolia)

Attestations are optional and run on a testnet. They are not a legal verdict. The check flow works without any of this.

## 1. Create a throwaway wallet
Use a new browser wallet (MetaMask, Rabby, etc.) that holds no real funds. Never reuse a wallet that holds real money. Never paste its seed phrase or private key into this repo, chat or `.env` files.

## 2. Add the Base Sepolia network
| Field | Value |
| --- | --- |
| Network name | Base Sepolia |
| Chain ID | 84532 |
| RPC URL | https://sepolia.base.org |
| Currency | ETH |
| Explorer | https://sepolia.basescan.org |

## 3. Get test ETH
Use any Base Sepolia faucet (search "Base Sepolia faucet"; the Coinbase developer platform and Alchemy faucets work). Test ETH has no value. A few cents' worth is enough.

## 4. Register the EAS schema
1. Open https://base-sepolia.easscan.org/schema/create and connect the throwaway wallet.
2. Paste this schema exactly:
   ```
   string subjectAddress,string chain,uint8 riskScore,string verdict,bytes32 reportHash
   ```
3. Leave resolver empty, revocable on, and submit. Copy the schema UID (0x… 64 hex chars).

## 5. Get a WalletConnect (Reown) project ID
Create a free project at https://cloud.reown.com and copy the project ID. Add your site origin (`http://localhost:3000` and the Vercel URL) to its allowed domains.

## 6. Set environment variables
Local: put these in `frontend/.env.local` (never commit it).
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<project id>
NEXT_PUBLIC_EAS_SCHEMA_UID=<schema uid>
```
Vercel: Project, Settings, Environment Variables. Add the same two names for Production and Preview, then redeploy (`NEXT_PUBLIC_*` values are baked in at build time).

## 7. Create one attestation
1. Run a check on a Bitcoin address and wait for the result.
2. Open the attest panel, connect the wallet, and confirm it shows Base Sepolia.
3. Press Create attestation and confirm in the wallet. The page shows "Transaction sent" with a BaseScan link, then "Attestation created".
4. Open the easscan link shown on success.

## 8. Verify
Press Verify under the attestation. Expected: every row says Match (report hash on this page, the backend hash, and the on-chain fields). Mismatch or Revoked rows list the differing fields.

## Troubleshooting
| Symptom | Cause and fix |
| --- | --- |
| Connect button does nothing / no wallets listed | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` missing, or origin not allowed in the Reown project. |
| "Switch to Base Sepolia" shown | Wallet is on another chain. Switch network from the prompt. |
| Insufficient funds error | Wallet has no test ETH. Use a faucet again. |
| "You rejected the request" | The wallet prompt was cancelled. Press Create again. |
| Stays on "Transaction sent" | Network is slow. Open the BaseScan link, check status. |
| Create button disabled, hash error | The report hash on this page differs from the backend's. Run the check again; do not attest. |
| Schema not configured | `NEXT_PUBLIC_EAS_SCHEMA_UID` missing; set it and rebuild. |
| Verify says network error | RPC unreachable. Try again in a moment. |
