# SearXNG Setup

Self-hosted SearXNG instance — lean 6-engine config. No API keys needed.

## Quick Start

```bash
docker compose up -d
```

Open http://127.0.0.1:8888

### Customize

Edit `config/settings.yml`, then restart:

```bash
docker compose restart core
```

## Benchmark

```bash
python scripts/benchmark.py
```

Requires Python 3 and `curl.exe` (pre-installed on Windows).

## Stats

| Metric | Value |
|--------|-------|
| Working engines | 6 |
| Avg response time | 0.5–1.4s |
| Results/query | 8–10 |

## Engines

| Engine | Timeout | Weight | Avg time |
|--------|---------|--------|----------|
| bing | 2.0s | 3 | 0.52s |
| vuhuv | 5.0s | 2 | 0.82s |
| privacywall | 5.0s | 2 | 0.99s |
| yandex | 2.0s | 2 | 1.13s |
| dogpile | 3.0s | 2 | 1.17s |
| gmx | 2.0s | 1 | 1.35s |

## Project Structure

```
├── config/
│   └── settings.yml      Engine configuration
├── scripts/
│   └── benchmark.py      Benchmarking script
├── docker-compose.yml    Docker Compose definition
├── .env                  Environment variables
├── .gitignore
└── README.md
```

## Related

- [config/settings.yml](config/settings.yml) — engine configuration
- [scripts/benchmark.py](scripts/benchmark.py) — benchmarking script
