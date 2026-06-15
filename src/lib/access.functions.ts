import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const OWNER_PASSWORD = () => process.env.OWNER_PASSWORD || "RITAM123";

function getMeta() {
  try {
    const req = getRequest();
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    return { ip, ua };
  } catch {
    return { ip: "unknown", ua: "unknown" };
  }
}

function requireOwner(token: string | undefined) {
  if (!token || token !== OWNER_PASSWORD()) {
    throw new Error("Unauthorized: owner credentials required");
  }
}

const submitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(160),
  designation: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(4).max(40),
  industry: z.string().trim().min(1).max(120),
  linkedin: z.string().trim().max(255).optional().or(z.literal("")),
  reason: z.string().trim().min(10).max(2000),
});

export const submitAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, ua } = getMeta();

    // throttle: max 1 pending per email
    const { data: existing } = await supabaseAdmin
      .from("access_requests")
      .select("id,status")
      .eq("email", data.email.toLowerCase())
      .in("status", ["pending", "approved"])
      .limit(1);
    if (existing && existing.length > 0) {
      return { ok: false, code: "duplicate", message: "A request for this email already exists." };
    }

    const { data: row, error } = await supabaseAdmin
      .from("access_requests")
      .insert({
        name: data.name,
        company: data.company,
        designation: data.designation,
        email: data.email.toLowerCase(),
        phone: data.phone,
        industry: data.industry,
        linkedin: data.linkedin || null,
        reason: data.reason,
        ip,
        user_agent: ua,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_events").insert({
      actor: data.email.toLowerCase(),
      action: "access.requested",
      target: row.id,
      detail: `${data.name} · ${data.company}`,
      ip,
      user_agent: ua,
    });

    return { ok: true, id: row.id };
  });

export const listAccessRequests = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; status?: string }) => d)
  .handler(async ({ data }) => {
    requireOwner(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("access_requests").select("*").order("created_at", { ascending: false });
    if (data.status && data.status !== "all") {
      q = q.eq("status", data.status as "pending" | "approved" | "denied" | "expired");
    }
    const { data: rows, error } = await q.limit(500);
    if (error) throw new Error(error.message);
    return { rows: rows || [] };
  });

function randToken(n = 24) {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  for (let i = 0; i < n; i++) s += a[arr[i] % a.length];
  return s;
}

export const approveAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireOwner(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, ua } = getMeta();

    const { data: req, error: e1 } = await supabaseAdmin
      .from("access_requests").select("*").eq("id", data.id).single();
    if (e1 || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already decided");

    const tok = randToken(28);
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await supabaseAdmin.from("invite_tokens").insert({
      token: tok, request_id: req.id, email: req.email, name: req.name, expires_at: expires,
    });
    await supabaseAdmin.from("access_requests")
      .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: "owner" })
      .eq("id", req.id);
    await supabaseAdmin.from("audit_events").insert({
      actor: "owner", action: "access.approved", target: req.id,
      detail: `${req.email} · invite ${tok}`, ip, user_agent: ua,
    });

    return { ok: true, token: tok, expires_at: expires, email: req.email, name: req.name };
  });

export const denyAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; note?: string }) => d)
  .handler(async ({ data }) => {
    requireOwner(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, ua } = getMeta();

    const { data: req, error } = await supabaseAdmin
      .from("access_requests").select("email,status").eq("id", data.id).single();
    if (error || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already decided");

    await supabaseAdmin.from("access_requests").update({
      status: "denied", decided_at: new Date().toISOString(), decided_by: "owner",
      decision_note: data.note || null,
    }).eq("id", data.id);
    await supabaseAdmin.from("audit_events").insert({
      actor: "owner", action: "access.denied", target: data.id, detail: req.email, ip, user_agent: ua,
    });
    return { ok: true };
  });

export const lookupInvite = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("invite_tokens").select("*").eq("token", data.token).maybeSingle();
    if (!row) return { ok: false, reason: "not_found" as const };
    if (row.used_at) return { ok: false, reason: "used" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" as const };
    return { ok: true, email: row.email, name: row.name, expires_at: row.expires_at };
  });

export const consumeInvite = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ip, ua } = getMeta();
    const { data: row } = await supabaseAdmin
      .from("invite_tokens").select("*").eq("token", data.token).maybeSingle();
    if (!row) throw new Error("Invalid invite");
    if (row.used_at) throw new Error("Invite already used");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Invite expired");
    await supabaseAdmin.from("invite_tokens").update({ used_at: new Date().toISOString() }).eq("token", data.token);
    await supabaseAdmin.from("audit_events").insert({
      actor: row.email, action: "account.activated", target: row.request_id,
      detail: row.name, ip, user_agent: ua,
    });
    return { ok: true, email: row.email, name: row.name };
  });

export const verifyOwner = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ data }) => {
    return { ok: data.password === OWNER_PASSWORD() };
  });

export const listAuditEvents = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireOwner(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("audit_events").select("*").order("ts", { ascending: false }).limit(500);
    return { rows: rows || [] };
  });