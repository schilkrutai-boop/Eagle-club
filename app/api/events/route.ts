import { subscribe } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let unsubscribe: () => void = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event })}\n\n`));
        } catch {
          // stream closed
        }
      };
      send("connected");
      unsubscribe = subscribe(send);
      ping = setInterval(() => send("ping"), 25000);
    },
    cancel() {
      unsubscribe();
      if (ping) clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
