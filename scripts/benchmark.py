#!/usr/bin/env python3
"""
Benchmark individual SearXNG engines for speed and result count.

Usage:
    python3 scripts/benchmark.py [--query "test"] [--timeout 30]

Requires a running SearXNG instance at http://127.0.0.1:8888
"""

import json
import subprocess
import sys
import time

WORKING_ENGINES = [
    "bing", "yandex", "dogpile",
    "gmx", "vuhuv", "privacywall"
]

SEARXNG_URL = "http://127.0.0.1:8888"


def benchmark_engine(engine: str, query: str, timeout: int = 30):
    start = time.time()
    try:
        r = subprocess.run([
            "curl", "-s", "-m", str(timeout), "-X", "POST",
            f"{SEARXNG_URL}/search",
            "-d", f"q={query}&format=json&engines={engine}",
            "-H", "Content-Type: application/x-www-form-urlencoded"
        ], capture_output=True, text=True, timeout=timeout + 5)
        elapsed = time.time() - start
        if r.returncode == 0 and r.stdout.strip():
            data = json.loads(r.stdout)
            n_results = len(data.get("results", []))
            return {"time": round(elapsed, 2), "results": n_results, "status": "ok"}
        return {"time": round(elapsed, 2), "results": 0, "status": f"exit={r.returncode}"}
    except Exception as e:
        elapsed = time.time() - start
        return {"time": round(elapsed, 2), "results": 0, "status": str(e)[:60]}


def main():
    query = sys.argv[1] if len(sys.argv) > 1 else "test"
    timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 30

    print(f"Benchmarking {len(WORKING_ENGINES)} engines...")
    print(f"Query: \"{query}\"  Timeout: {timeout}s\n")

    results = {}
    for engine in WORKING_ENGINES:
        res = benchmark_engine(engine, query, timeout)
        results[engine] = res
        print(f"  {engine:25s} {res['time']:5.2f}s  {res['results']:3d} results  {res['status']}")
        sys.stdout.flush()

    print(f"\n\n=== SORTED BY SPEED ===\n")
    sorted_engines = sorted(results.items(), key=lambda x: x[1]["time"])
    for e, r in sorted_engines:
        print(f"  {e:25s} {r['time']:5.2f}s  {r['results']:3d} results")

    fast = [e for e, r in results.items() if r["time"] < 5 and r["results"] > 0]
    medium = [e for e, r in results.items() if 5 <= r["time"] < 10 and r["results"] > 0]
    slow = [e for e, r in results.items() if r["time"] >= 10 and r["results"] > 0]
    broken = [e for e, r in results.items() if r["results"] == 0]

    print(f"\nFast (< 5s): {len(fast)}")
    print(f"Medium (5-10s): {len(medium)}")
    print(f"Slow (>= 10s): {len(slow)}")
    print(f"Broken (no results): {len(broken)}")


if __name__ == "__main__":
    main()