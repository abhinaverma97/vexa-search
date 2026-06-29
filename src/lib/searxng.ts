export interface SearXNGResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
  score: number;
  category: string;
}

export interface SearXNGResponse {
  query: string;
  results: SearXNGResult[];
  number_of_results: number;
}

export async function search(
  query: string,
  limit?: number
): Promise<SearXNGResult[]> {
  const searxngUrl =
    process.env.SEARXNG_URL ?? `http://${process.env.SEARXNG_HOST ?? "127.0.0.1"}:${process.env.SEARXNG_PORT ?? "8888"}`;

  const res = await fetch(`${searxngUrl}/search?format=json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ q: query }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`SearXNG returned ${res.status}`);
  }

  const data = (await res.json()) as SearXNGResponse;

  let results = data.results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.snippet,
    engine: r.engine,
    score: r.score,
    category: r.category,
  }));

  if (limit !== undefined && limit > 0) {
    results = results.slice(0, limit);
  }

  return results;
}
