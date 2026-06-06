// payments-midtrans-charge
// Creates a Midtrans Snap transaction for an existing order. The amount is
// recomputed server-side from the order row (never trusted from the client).
// Inserts a `payment` row (status 'pending') keyed by the client idempotency_key,
// and returns the Snap token / redirect_url.
//
// Env (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY, MIDTRANS_IS_PRODUCTION
//
// Deploy: supabase functions deploy payments-midtrans-charge

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;
const IS_PROD = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";

const SNAP_URL = IS_PROD
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const { order_id, method, idempotency_key } = await req.json();
    if (!order_id || !idempotency_key) {
      return json({ error: "order_id and idempotency_key are required" }, 400);
    }

    // Service-role client — server-side only, bypasses RLS.
    const db = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Idempotency: return the existing payment if this key was already used.
    const { data: existing } = await db
      .from("payment").select("*").eq("idempotency_key", idempotency_key).maybeSingle();
    if (existing?.provider_ref) {
      return json({ payment: existing, reused: true });
    }

    // Recompute amount from the order (authoritative).
    const { data: order, error: orderErr } = await db
      .from("order").select("id, order_no, grand_total, status").eq("id", order_id).single();
    if (orderErr || !order) return json({ error: "order not found" }, 404);
    if (order.status === "paid") return json({ error: "order already paid" }, 409);

    // Create the pending payment row (provider_ref = Midtrans order id = payment id).
    const { data: payment, error: payErr } = await db
      .from("payment")
      .insert({
        order_id: order.id,
        method: method ?? "qris",
        amount: order.grand_total,
        status: "pending",
        provider: "midtrans",
        idempotency_key,
      })
      .select()
      .single();
    if (payErr) return json({ error: payErr.message }, 500);

    // Call Midtrans Snap.
    const auth = btoa(`${MIDTRANS_SERVER_KEY}:`);
    const res = await fetch(SNAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: payment.id, gross_amount: order.grand_total },
        // QRIS/e-wallet/VA/card are enabled in the Midtrans dashboard.
      }),
    });
    const snap = await res.json();
    if (!res.ok) {
      await db.from("payment").update({ status: "failed", raw_payload: snap }).eq("id", payment.id);
      return json({ error: "midtrans charge failed", detail: snap }, 502);
    }

    await db.from("payment")
      .update({ provider_ref: payment.id, raw_payload: snap })
      .eq("id", payment.id);

    return json({ payment_id: payment.id, token: snap.token, redirect_url: snap.redirect_url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
