import { createFileRoute } from "@tanstack/react-router";
import { copilotContext } from "@/lib/mockData";

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "LOVABLE_API_KEY missing" }, { status: 500 });
        const body = await request.json() as { messages: { role: string; content: string }[] };
        const ctx = copilotContext();
        const sys = `You are SUPPLYMIND COPILOT, an expert assistant for object-centric process mining and supply-chain shortage management.
You answer concisely (max 6 sentences) and ground every answer in the LIVE DATA below.
If the data does not support an answer, say so honestly. Never invent IDs.
At the end of each answer, give a confidence score between 0.0 and 1.0 on its own line as: CONFIDENCE: 0.xx

LIVE DATA:
${ctx}`;
        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "content-type": "application/json", "Authorization": `Bearer ${key}` },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: sys }, ...body.messages],
            }),
          });
          if (r.status === 429) return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
          if (r.status === 402) return Response.json({ error: "AI credits exhausted. Add credits to continue." }, { status: 402 });
          if (!r.ok) return Response.json({ error: `Gateway ${r.status}` }, { status: 500 });
          const data = await r.json();
          let text: string = data.choices?.[0]?.message?.content ?? "(no response)";
          let confidence = 0.8;
          const m = text.match(/CONFIDENCE:\s*([0-9.]+)/i);
          if (m) { confidence = Math.max(0, Math.min(1, parseFloat(m[1]))); text = text.replace(m[0], "").trim(); }
          return Response.json({ text, confidence });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
