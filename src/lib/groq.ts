import Groq from "groq-sdk";

function getGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: key, timeout: 30_000 });
}

const MODEL = "llama-3.3-70b-versatile";

export interface Analysis {
  summary: string;
  key_insights: string[];
  result_relevance: { url: string; relevance: string }[];
}

export async function analyzeResults(
  query: string,
  results: { title: string; url: string; snippet: string }[]
): Promise<Analysis> {
  const groq = getGroq();

  const prompt = `You are a search analysis AI. Given the query "${query}" and the following search results, provide:
1. A 2-3 sentence summary of what the results show
2. Key insights as a bullet list
3. Per-result relevance explanation

Search results:
${JSON.stringify(results, null, 2)}

Return valid JSON with keys: summary (string), key_insights (string[]), result_relevance (array of {url: string, relevance: string})`;

  const completion = await groq.chat.completions.create(
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2048,
    },
    { timeout: 15_000 }
  );

  const text = completion.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(text) as Analysis;
  } catch {
    return {
      summary: "Failed to parse analysis.",
      key_insights: [],
      result_relevance: results.map((r) => ({
        url: r.url,
        relevance: "Analysis unavailable",
      })),
    };
  }
}

export interface DeepResearchReport {
  report: string;
  sources: { url: string; title: string; key_findings: string }[];
}

export async function deepResearch(
  queries: string[][],
  resultSets: { title: string; url: string; snippet: string; engine: string; category: string }[][]
): Promise<DeepResearchReport> {
  const groq = getGroq();

  const prompt = `You have performed a multi-step research across the following queries and results.

Research rounds:
${queries
  .map(
    (q, i) => `Round ${i + 1} - Query: "${q}"
Results: ${JSON.stringify(resultSets[i]?.slice(0, 5) ?? [], null, 2)}`
  )
  .join("\n\n")}

Synthesize all findings into a comprehensive research report covering:
1. Executive summary
2. Key findings organized by theme
3. Important data points and statistics
4. Conclusions

Also identify the most valuable sources and what each contributed.

Return valid JSON with keys: report (string), sources (array of {url: string, title: string, key_findings: string})`;

  const completion = await groq.chat.completions.create(
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4096,
    },
    { timeout: 15_000 }
  );

  const text = completion.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(text) as DeepResearchReport;
  } catch {
    return {
      report: "Failed to synthesize research.",
      sources: [],
    };
  }
}
