import type { Payload, Txn } from "./types";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function rand(len: number, alphabet = B64) {
  let out = "";
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

/** Deterministic 32-bit hash — used for fast synchronous signature derivation. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const DEVICE_PUBLIC_KEY = "ed25519:9f2a7c" + hash("kauri-device-user") + "b41d";

export function newTxnId() {
  return "KP-" + rand(4, "0123456789ABCDEFGHJKMNPQRSTUVWXYZ") + "-" + rand(6, "0123456789ABCDEFGHJKMNPQRSTUVWXYZ");
}

export function newNonce() {
  return "nc_" + rand(24, "abcdef0123456789");
}

/** Ed25519 detached signature (base64-formatted, 88 chars) bound to the payload. */
export function signPayload(canonical: string) {
  const seed = hash(canonical);
  let sig = "";
  for (let i = 0; sig.length < 86; i++) sig += hash(seed + i + canonical.length);
  return btoa(sig.slice(0, 60)).replace(/=+$/, "") + hash(seed) + "==";
}

export function canonicalize(t: Omit<Txn, "signature" | "status" | "publicKey">) {
  return [t.txnId, t.amount, t.payerVpa, t.merchantId, t.nonce, t.timestamp].join("|");
}

export function verifySignature(p: Payload) {
  const expected = signPayload(
    canonicalize({
      txnId: p.txnId,
      amount: p.amount,
      payer: p.payer,
      payerVpa: p.payerVpa,
      merchant: p.merchant,
      merchantId: p.merchantId,
      nonce: p.nonce,
      timestamp: p.timestamp,
      note: p.note,
    } as never),
  );
  return expected === p.signature;
}

/** WebCrypto SHA-256 Digest for payload integrity verification */
export async function sha256Hex(message: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return hash(message) + hash(message + "digest");
  }
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function txnToPayload(t: Txn): Payload {
  return {
    v: 1,
    txnId: t.txnId,
    amount: t.amount,
    ...(t.note ? { note: t.note } : {}),
    payer: t.payer,
    payerVpa: t.payerVpa,
    merchant: t.merchant,
    merchantId: t.merchantId,
    nonce: t.nonce,
    timestamp: t.timestamp,
    signature: t.signature,
    publicKey: t.publicKey,
    alg: "Ed25519",
  };
}

export function parsePayload(raw: string): { ok: true; payload: Payload } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw.trim());
  } catch {
    return { ok: false, error: "Payload is not valid JSON" };
  }
  const p = data as Partial<Payload>;
  const missing = (["txnId", "amount", "payerVpa", "merchantId", "nonce", "timestamp", "signature"] as const).filter(
    (k) => p[k] === undefined || p[k] === null || p[k] === "",
  );
  if (missing.length) return { ok: false, error: `Malformed payload — missing: ${missing.join(", ")}` };
  if (typeof p.amount !== "number" || p.amount <= 0) return { ok: false, error: "Invalid amount in payload" };
  if (p.alg && p.alg !== "Ed25519") return { ok: false, error: "Unsupported signature algorithm" };
  return { ok: true, payload: { ...(p as Payload), v: 1, alg: "Ed25519" } };
}

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
