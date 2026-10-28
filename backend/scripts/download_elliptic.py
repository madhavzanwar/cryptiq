"""Helper script to download Elliptic++ dataset files using gdown."""
import os
from pathlib import Path
import gdown

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

FILES = [
    ("AddrAddr_edgelist.csv", "1x5JdNWX8fVM3FO8I0wOLDAeh2qaB53uV"),
    ("wallets_features.csv", "1mhrrobYdnaxYBIVK06EpKB2EwV-ERlce"),
]

for filename, file_id in FILES:
    dest = RAW_DIR / filename
    if dest.exists() and dest.stat().st_size > 0:
        print(f"{filename} already exists ({dest.stat().st_size} bytes), skipping.")
        continue
    print(f"Downloading {filename} (id={file_id})...")
    gdown.download(id=file_id, output=str(dest), quiet=False)
    print(f"Finished {filename}.")
