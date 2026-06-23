# SearXNG Setup — Self-Hosted Meta Search Engine

This repo documents the setup of a **SearXNG** instance on Ubuntu 24.04, configured with 33 curated search engines that were tested and benchmarked for reliability, speed, and zero API-key requirements.

## Overview

SearXNG is a privacy-respecting, self-hosted metasearch engine that aggregates results from multiple search engines simultaneously. This setup runs it inside a Docker container with auto-restart, bound to `localhost:8888` for local use by other tools (like [Hermes Agent](https://hermes-agent.nousresearch.com)).

### Quick Stats

| Metric | Value |
|---|---|
| Total engines in default config | 335 |
| Working engines (tested) | **33** |
| Blocked (CAPTCHA / rate-limited) | 18 |
| API key required | 57 (already `inactive` by default) |
| Silent / niche (no results) | ~227 |
| Avg query response time | **~3.4s** |
| Results per query (typical) | 200–400 |

## Setup

### 1. Install Docker

```bash
apt-get update
apt-get install -y docker.io
systemctl start docker
```

### 2. Run SearXNG

```bash
mkdir -p /opt/searxng
docker pull searxng/searxng
```

Create `settings.yml` (see below) at `/opt/searxng/settings.yml`, then:

```bash
docker run -d \
  --name searxng \
  -p 8888:8080 \
  -v /opt/searxng/settings.yml:/etc/searxng/settings.yml:ro \
  --restart unless-stopped \
  searxng/searxng
```

The container auto-restarts on boot/reboot (`--restart unless-stopped`).

### 3. Verify

```bash
# Quick health check
curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/

# Test a search query
curl -s -X POST "http://localhost:8888/search" \
  -d "q=hello+world&format=json" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{len(d[\"results\"])} results from {len(set(r[\"engine\"] for r in d[\"results\"]))} engines')"
```

### 4. Connect Hermes Agent

```bash
hermes config set search.provider searxng
hermes config set search.searxng_url http://localhost:8888
```

Then start a fresh session (`/reset` or new `hermes` invocation).

## Benchmark Methodology

1. Started SearXNG with **all 335 engines enabled** (`disabled: true` → `disabled: false` in `settings.yml`)
2. Ran two test queries across all engines:
   - `"hello world"` (general)
   - `"python tutorial 2025"` (technical)
3. Measured response time, result count, and error type for each engine
4. Categorized results:

```
Working (returns results)     → 33 engines kept
CAPTCHA / rate-limited        → 18 engines dropped (DuckDuckGo, Brave, Qwant, Baidu, etc.)
Timeout / no response         → ~227 engines dropped
API key required              → 57 engines already inactive by default
```

## The 33 Engines

All confirmed working without API keys, with benchmark timing:

### Tier 1 — General Web (< 1 second)

| Engine | Time | Results |
|--------|------|---------|
| wikipedia | 0.15s | 1 |
| bing | 0.23s | 10 |
| google | 0.39s | 10 |
| mwmbl | 0.56s | 121 |
| bpb | 0.72s | 15 |
| duckduckgo web | 0.78s | 10 |
| privacywall | 0.74s | 10 |
| encyclosearch | 0.76s | 15 |
| wikimini | 0.76s | 26 |
| fynd | 0.73s | 10 |
| vuhuv | 0.72s | 10 |
| mojeek | 0.93s | 10 |
| quark | 0.93s | 11 |
| dogpile | 1.00s | 8 |
| crowdview | 1.05s | 98 |
| searchmysite | 1.09s | 10 |
| wiby | 0.87s | 12 |
| searchch | 0.83s | 10 |

### Tier 2 — Good Backups (< 2 seconds)

| Engine | Time | Results |
|--------|------|---------|
| gmx | 1.30s | 10 |
| yep | 1.31s | 20 |
| abcnyheter | 1.36s | 9 |
| yandex | 1.36s | 10 |
| reloado | 1.37s | 82 |
| sogou | 1.63s | 10 |
| resulthunter | 1.74s | 20 |
| tusksearch | 1.77s | 15 |

### Tier 3 — Specialized (< 5 seconds)

| Engine | Time | Results | Notes |
|--------|------|---------|-------|
| boardreader | 2.47s | 8 | Forum search |
| openlibrary | 3.28s | 10 | Book search |
| 360search | 4.76s | 6 | Chinese web |
| wolframalpha | 4.77s | 1 | Computational knowledge |
| ayo | ~2s | 4 | German search engine |
| ddg definitions | 0.12s | 0 | Dictionary definitions (works for lookups) |

## Engines That Were Blocked & Removed

These engines responded but were blocked by CAPTCHA, rate limits, or access denial:

| Engine | Reason |
|--------|--------|
| baidu | CAPTCHA |
| brave | Too many requests |
| duckduckgo (direct) | CAPTCHA |
| fastbot | Access denied |
| fireball | Access denied |
| gabanza | Timeout |
| presearch | Access denied |
| presearch videos | Access denied |
| qwant | Access denied |
| startpage | CAPTCHA |
| wikibooks | Too many requests |
| wikiquote | Too many requests |
| wikisource | Too many requests |
| wikispecies | Too many requests |
| wikiversity | Too many requests |
| wikivoyage | Too many requests |
| yacy | Timeout |
| zapmeta | Access denied |

## Configuration Files

- [`settings.yml`](settings.yml) — The curated SearXNG config with only the 33 working engines
- [`scripts/benchmark.py`](scripts/benchmark.py) — Benchmark script used for testing

## Docker Compose (Alternative)

For a more persistent setup, create `docker-compose.yml`:

```yaml
version: '3'
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "127.0.0.1:8888:8080"
    volumes:
      - ./settings.yml:/etc/searxng/settings.yml:ro
    restart: unless-stopped
```

Then `docker compose up -d`.