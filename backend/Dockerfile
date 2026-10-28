FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_SYSTEM_PYTHON=1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
COPY scripts ./scripts
COPY seed ./seed
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# artifacts/ and data/ are mounted (volume) or copied at deploy time; they are never in the image
RUN useradd -m cryptiq && mkdir -p /app/data /app/artifacts && chown -R cryptiq /app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fsS http://localhost:8000/api/health || exit 1
# X-Forwarded-For is NOT trusted (uvicorn default: only 127.0.0.1); rate limits key on Fly-Client-IP
# when TRUST_FLY_CLIENT_IP=true (see app/ratelimit.py)
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
