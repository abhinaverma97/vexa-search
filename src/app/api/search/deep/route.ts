import { NextRequest, NextResponse } from "next/server";
import { deepSearch } from "@/lib/deep-search";
import { requireApiKey } from "@/lib/with-auth";

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth instanceof NextResponse) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "Unauthorized" })}\n\n`,
      { status: 401, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: { query?: string; limit?: number };

  try {
    const text = await req.text();
    if (text.length > 10_000) {
      throw new Error("Body too large");
    }
    body = JSON.parse(text);
  } catch {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "Invalid JSON body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { query, limit } = body;

  if (typeof query !== "string" || !query.trim() || query.length > 500) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: "Missing or invalid 'query' field" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of deepSearch(query, limit)) {
          controller.enqueue(encoder.encode(event));
        }
      } catch {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: "Deep search failed" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
