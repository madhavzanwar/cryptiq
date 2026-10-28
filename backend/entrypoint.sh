#!/bin/sh
set -e

if [ -d "/data" ]; then
    chown -R cryptiq:cryptiq /data
fi

mkdir -p /data/data/labels /data/artifacts

if [ ! -f "/data/data/labels/ofac_btc.txt" ] && [ -f "/app/seed/ofac_btc.txt" ]; then
    cp /app/seed/ofac_btc.txt /data/data/labels/ofac_btc.txt
fi

chown -R cryptiq:cryptiq /data

exec su -s /bin/sh cryptiq -c "/app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"
