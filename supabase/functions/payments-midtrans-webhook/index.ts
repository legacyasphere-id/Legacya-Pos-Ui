// payments-midtrans-webhook
// Receives Midtrans HTTP notifications, verifies the signature, reconciles the
// payment + order, and consumes stock on settlement. Must be public (no Supabase
// JWT) — see config.toml: [functions.payments-midtrans-webhook] verify_jwt = false.
//
// Signature: sha512(order_id + status_code + gross_amount + server_key)
// Midtrans `order_id` == our payment.id (set in payments-midtrans-charge).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY
// Deploy: supabase functions deploy payments-midtrans-webhook --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const n = await req.json();
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = n;

  // Verify signature.
  const expected = await sha512(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`);
  if (expected !== signature_key) {
    return new Response("invalid signature", { status: 401 });
  }

  const db = createClient(SUPABASE_URL, SERVICE_ROLE);

  // order_id from Midtrans == our payment.id (also stored as provider_ref).
  const { data: payment } = await db
    .from("payment").select("*").eq("id", order_id).maybeSingle();
  if (!payment) return new Response("payment not found", { status: 404 });

  const newStatus = mapStatus(transaction_status, fraud_status);

  // Idempotent: nothing to do if already settled.
  if (payment.status === "settled" && newStatus === "settled") {
    return new Response("ok (already settled)", { status: 200 });
  }

  await db.from("payment")
    .update({
      status: newStatus,
      raw_payload: n,
      paid_at: newStatus === "settled" ? new Date().toISOString() : payment.paid_at,
    })
    .eq("id", payment.id);

  if (newStatus === "settled") {
    await db.from("order").update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.order_id);
    // Expand BOM + write stock movements (idempotent inside the function).
    await db.rpc("consume_stock_for_order", { p_order_id: payment.order_id });
  }

  return new Response("ok", { status: 200 });
});

function mapStatus(txn: string, fraud?: string): string {
  if (txn === "capture") return fraud === "challenge" ? "pending" : "settled";
  if (txn === "settlement") return "settled";
  if (txn === "pending") return "pending";
  if (txn === "deny" || txn === "cancel" || txn === "failure") return "failed";
  if (txn === "expire") return "expired";
  if (txn === "refund") return "refunded";
  return "pending";
}

async function sha512(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
