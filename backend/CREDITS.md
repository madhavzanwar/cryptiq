# Backend credits (staging)

These rows belong in `docs/CREDITS.md`. That file is added by the still-open repo-setup PR
(`chore/repo-setup`); to avoid an add/add merge conflict they live here until it is merged, then they
are appended there (same columns).

| Component | Source link | Licence | What we used | Where |
|---|---|---|---|---|
| Elliptic++ dataset (Elmougy & Liu, KDD 2023, DOI 10.1145/3580305.3599803) | https://github.com/git-disl/EllipticPlusPlus | No licence stated (research dataset; never committed, downloaded by each user) | wallets_classes.csv, wallets_features.csv, AddrAddr_edgelist.csv; schema read from its notebooks | `backend/scripts/*`, `backend/app/services/datasets/` |
| OFAC sanctioned digital currency addresses (0xB10C) | https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses | MIT | `lists` branch, `sanctioned_addresses_XBT.txt`, downloaded at build time | `backend/scripts/fetch_labels.py`, `backend/app/services/labels/` |
| BIP-39 English wordlist | https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt | MIT (BIP-39) | wordlist file, to detect seed phrases | `backend/app/services/resources/bip39_english.txt` |
| BIP-173 / BIP-350 bech32 reference algorithm | https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki , https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki | BSD-2-Clause (BIPs) / reference code MIT | checksum algorithm re-implemented from the spec | `backend/app/services/address.py` |
