"use client";

import { useState, useRef, useEffect } from "react";

type Mode = "search" | "analyze" | "deep";

interface Result {
  title: string;
  url: string;
  snippet: string;
  engine: string;
  score: number;
}

interface DeepEvent {
  type: string;
  query?: string;
  results?: Result[];
  analysis?: string | { summary: string; key_insights: string[]; result_relevance: string };
  subtopics?: string[];
  round?: number;
  totalRounds?: number;
  report?: string;
  sources?: { title: string; url: string }[];
  error?: string;
  step?: string;
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="px-4 py-3 space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-2.5 w-24 bg-[#181818]" />
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 flex-1 bg-[#181818]" />
            <div className="h-3.5 w-6 bg-[#181818]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchDemo() {
  const [mode, setMode] = useState<Mode>("search");
  const modeRef = useRef(mode);
  const [query, setQuery] = useState("why do i lose on polymarket");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [deepReport, setDeepReport] = useState<string | null>(null);
  const [deepSources, setDeepSources] = useState<{ title: string; url: string }[]>([]);
  const [deepRounds, setDeepRounds] = useState<{ round: number; status: string }[]>([]);
  const [timing, setTiming] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    doSearchWithMode(modeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearchWithMode(activeMode: Mode) {
    if (!query.trim()) return;
    setHasSearched(true);
    setLoading(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setDeepReport(null);
    setDeepSources([]);
    setDeepRounds([]);
    setTiming(null);

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      if (activeMode === "deep") {
        const res = await fetch("/api/search/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), mode: "deep" }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Search failed" }));
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
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const event: DeepEvent = JSON.parse(data);
              if (event.type === "error") {
                setError(event.error ?? "Search failed");
                setLoading(false);
                return;
              }
              if (event.type === "result") {
                setResults(event.results ?? []);
              }
              if (event.type === "analysis") {
                const a = event.analysis;
                setSummary(typeof a === "string" ? a : a?.summary ?? null);
              }
              if (event.type === "status" && event.step === "synthesizing") {
                setDeepRounds((prev) => {
                  if (prev.length === 3) return prev;
                  return [...prev, { round: 3, status: "synthesizing" }];
                });
              }
              if (event.type === "status" && event.step === "refine_search") {
                setDeepRounds((prev) => {
                  const r = event.round ?? prev.length + 1;
                  const exists = prev.some((x) => x.round === r);
                  if (exists) return prev;
                  return [...prev, { round: r, status: "searching" }];
                });
              }
              if (event.type === "partial") {
                setDeepRounds((prev) => {
                  const r = event.round ?? prev.length;
                  return prev.map((x) => (x.round === r ? { ...x, status: "complete" } : x));
                });
              }
              if (event.type === "complete") {
                setDeepReport(event.report ?? null);
                setDeepSources(event.sources ?? []);
              }
            } catch {
              // skip malformed events
            }
          }
        }
        } else {
        const res = await fetch("/api/search/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim(), mode: activeMode }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Search failed" }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setResults(data.results ?? []);
        if (data.summary) setSummary(data.summary);
        if (data.timing) setTiming(data.timing);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    modeRef.current = m;
    if (hasSearched && query.trim()) {
      doSearchWithMode(m);
    }
  }

  function doSearch() {
    doSearchWithMode(modeRef.current);
  }

  const showPlaceholder = !loading && !error && !hasSearched && results.length === 0 && !deepReport;

  return (
    <div className="border border-[#181818] bg-[#080808]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#181818]">
        <div className="flex flex-shrink-0 gap-1">
          {(["search", "analyze", "deep"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`text-xs px-2.5 py-1 border-0 ${mode === m ? "text-[#86efac]" : "text-[#444]"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-sm text-[#86efac] font-bold ml-1">&gt;</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
          className="flex-1 bg-transparent text-sm text-white outline-none border-0 p-0"
          placeholder="search anything..."
        />
        <button
          onClick={doSearch}
          disabled={loading}
          className="text-xs text-black px-3 py-1 font-medium bg-[#86efac] disabled:opacity-50"
        >
          {loading ? "..." : "→"}
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto text-sm">
        {error && (
          <div className="px-4 py-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {loading && mode === "deep" && (
          <div className="px-4 py-3 space-y-2 border-b border-[#0d0d0d]">
            {deepRounds.map((r) => (
              <div key={r.round} className="flex items-center gap-2">
                <span className={`w-2 h-2 ${r.status === "complete" ? "bg-[#86efac]" : "bg-[#444] animate-pulse"}`} />
                <span className={`text-xs font-medium ${r.status === "complete" ? "text-[#86efac]" : "text-[#555]"}`}>
                  round {r.round}/3
                </span>
                <span className="text-xs text-[#555]">
                  {r.status === "complete" ? "done" : r.status === "synthesizing" ? "synthesizing..." : "searching..."}
                </span>
              </div>
            ))}
            {deepRounds.length === 0 && (
              <p className="text-xs text-[#555]">starting search...</p>
            )}
            {deepRounds.length > 0 && deepRounds[deepRounds.length - 1]?.status !== "complete" && (
              <SkeletonRows count={2} />
            )}
          </div>
        )}

        {loading && mode !== "deep" && <SkeletonRows count={4} />}

        {summary && (
          <div className="px-4 py-3 border-b border-[#0d0d0d] space-y-2">
            <p className="text-xs text-[#86efac] font-medium">ai summary</p>
            <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {results.map((r, i) => (
          <div key={i} className={`px-4 py-2.5 ${i < results.length - 1 ? "border-b border-[#0d0d0d]" : ""}`}>
            <p className="text-xs text-[#555]">{new URL(r.url).hostname}</p>
            <div className="flex items-center justify-between gap-2">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[#e0e0e0] hover:text-[#86efac] hover:underline truncate">
                {r.title}
              </a>
              <span className="text-xs flex-shrink-0 text-[#86efac]">{Math.round(r.score)}</span>
            </div>
          </div>
        ))}

        {deepReport && (
          <div className="px-4 py-3 space-y-3">
            <p className="text-xs text-[#86efac] font-medium">research report</p>
            <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{deepReport}</p>
            {deepSources.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-[#86efac] font-medium">sources</p>
                {deepSources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#e0e0e0] hover:text-[#86efac] hover:underline">
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {showPlaceholder && (
          <div className="px-4 py-3 space-y-3">
            <div className="px-3 py-2 border-b border-[#0d0d0d]">
              <p className="text-xs text-[#555]">blog.jetbrains.com</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#e0e0e0] truncate">Rust vs Go: Which One to Choose in 2025</span>
                <span className="text-xs flex-shrink-0 text-[#86efac]">70</span>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-[#0d0d0d]">
              <p className="text-xs text-[#555]">blog.logrocket.com</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#e0e0e0] truncate">Go vs. Rust: When to Use Rust and When to Use Go</span>
                <span className="text-xs flex-shrink-0 text-[#86efac]">58</span>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-[#555]">tech-insider.org</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#e0e0e0] truncate">Rust vs Go 2026: 12x Benchmark Gap</span>
                <span className="text-xs flex-shrink-0 text-[#86efac]">34</span>
              </div>
            </div>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && !deepReport && !error && (
          <div className="px-4 py-3">
            <p className="text-xs text-[#555]">no results found</p>
          </div>
        )}
      </div>

      {timing && !loading && (
        <div className="px-4 py-2 border-t border-[#181818]">
          <p className="text-xs text-[#555]">{results.length} results · {timing}s</p>
        </div>
      )}
    </div>
  );
}
