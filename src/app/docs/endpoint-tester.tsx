"use client";

import { useState, useRef, useCallback } from "react";
import { CodeBlock } from "@/components/code-block";

interface EndpointTesterProps {
  mode: "search" | "analyze" | "deep";
}

export function EndpointTester({ mode }: EndpointTesterProps) {
  const [apiKey, setApiKey] = useState("");
  const [query, setQuery] = useState("why do i lose on polymarket");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [streamed, setStreamed] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const doRequest = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setStreamed("");

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const endpoint =
        mode === "search"
          ? "/api/search"
          : mode === "analyze"
            ? "/api/search/analyze"
            : "/api/search/deep";

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey.trim()) headers["x-api-key"] = apiKey.trim();

      if (mode === "deep") {
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: query.trim() }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              setStreamed((prev) => prev + data + "\n");
            }
          }
        }
      } else {
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: query.trim() }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [query, apiKey, mode]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="x-api-key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full border border-white/10 bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-xs text-white outline-none placeholder:text-[#555]"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") doRequest(); }}
          className="flex-1 border border-white/10 bg-white/[0.03] backdrop-blur-xl px-3 py-2 text-xs text-white outline-none placeholder:text-[#555]"
        />
        <button
          onClick={doRequest}
          disabled={loading}
          className="text-xs text-black px-4 py-2 font-medium bg-[#86efac] disabled:opacity-50"
        >
          {loading ? "..." : "send"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {response && (
        <CodeBlock code={response} language="json" />
      )}

      {streamed && (
        <CodeBlock code={streamed} language="json" />
      )}
    </div>
  );
}
