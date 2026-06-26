# SearXNG Setup

Self-hosted SearXNG instance with 33 curated search engines (no API keys needed).

## Quick Start

```bash
docker pull searxng/searxng
docker run -d \
  --name searxng \
  -p 8888:8080 \
  -v /opt/searxng/settings.yml:/etc/searxng/settings.yml:ro \
  --restart unless-stopped \
  searxng/searxng
```

## Stats

| Metric | Value |
|--------|-------|
| Working engines | 33 |
| Avg response time | ~3.4s |
| Results/query | 200–400 |

See [settings.yml](settings.yml) for the curated engine list.

## Connect Hermes Agent

```bash
hermes config set search.provider searxng
hermes config set search.searxng_url http://localhost:8888
```

## Related

- [settings.yml](settings.yml) — engine configuration
- [scripts/benchmark.py](scripts/benchmark.py) — benchmarking script
