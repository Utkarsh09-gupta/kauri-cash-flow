import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Clock, Database, Fingerprint, KeyRound, RefreshCw, ShieldCheck, ShieldAlert, CheckCircle2, RotateCcw } from "lucide-react";
import { AppShell, Panel } from "@/components/kauri/AppShell";
import { OFFLINE_TXN_LIMIT, type Payload } from "@/lib/kauri/types";
import { formatINR, verifySignature, signPayload, canonicalize, newNonce, DEVICE_PUBLIC_KEY } from "@/lib/kauri/crypto";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Center — Kauri Pay" },
      { name: "description", content: "How Kauri Pay uses Ed25519 signing, nonces, timestamp windows and sync reconciliation to protect offline payments." },
      { property: "og:title", content: "Security Center — Kauri Pay" },
      { property: "og:description", content: "Ed25519 signing, replay protection, freshness windows and offline double-spend mitigations explained." },
    ],
  }),
  component: SecurityCenter,
});

const CARDS = [
  {
    icon: KeyRound,
    title: "Ed25519 device signing",
    body: "Each payment is signed on the payer's device with a key held in secure storage. The detached signature covers transaction ID, amount, payer handle, merchant ID, nonce and timestamp — so nothing can be edited in transit.",
  },
  {
    icon: Fingerprint,
    title: "Nonce uniqueness",
    body: "Every payment carries a single-use random nonce. Merchant devices keep a local set of spent nonces and reject any repeat instantly, which blocks replaying the same QR at the same till.",
  },
  {
    icon: Clock,
    title: "Timestamp freshness window",
    body: "Payments are only accepted inside a 24-hour freshness window, and future-dated payloads are rejected. Stale QR screenshots stop working on their own.",
  },
  {
    icon: Database,
    title: "Local ledger persistence",
    body: "Accepted payments are written to the merchant's local ledger before the balance changes, so an app close, crash or battery pull never loses an offline receipt.",
  },
  {
    icon: RefreshCw,
    title: "Secure sync reconciliation",
    body: "On reconnect each entry is re-verified server-side: signature, nonce registry, freshness and payer funds. Only then does the entry move from Pending sync to Synced and settle.",
  },
  {
    icon: ShieldCheck,
    title: "Offline exposure caps",
    body: `Offline payments are capped at ${formatINR(OFFLINE_TXN_LIMIT)} each and drawn from a pre-funded offline balance, keeping the worst-case loss from any offline window small and bounded.`,
  },
];

function createSamplePayload(): Payload {
  const base = {
    txnId: "KP-DEMO-9988-77",
    amount: 250,
    note: "Security Sandbox Demo",
    payer: "Rahul Verma",
    payerVpa: "rahul@kauri",
    merchant: "Sharma Store",
    merchantId: "MERCH-SHARMA-001",
    nonce: newNonce(),
    timestamp: Date.now(),
  };
  return {
    v: 1,
    ...base,
    signature: signPayload(canonicalize(base as never)),
    publicKey: DEVICE_PUBLIC_KEY,
    alg: "Ed25519",
  };
}

function SecurityCenter() {
  const [samplePayload, setSamplePayload] = useState<Payload>(createSamplePayload);
  const [editedJson, setEditedJson] = useState<string>(() => JSON.stringify(createSamplePayload(), null, 2));

  const resetSandbox = () => {
    const fresh = createSamplePayload();
    setSamplePayload(fresh);
    setEditedJson(JSON.stringify(fresh, null, 2));
  };

  let parsed: Payload | null = null;
  let parseError = false;
  try {
    parsed = JSON.parse(editedJson) as Payload;
  } catch {
    parseError = true;
  }

  const isSigValid = parsed ? verifySignature(parsed) : false;

  const tamperAmount = () => {
    if (!parsed) return;
    const modified = { ...parsed, amount: 25000 };
    setEditedJson(JSON.stringify(modified, null, 2));
  };

  const corruptSig = () => {
    if (!parsed) return;
    const modified = { ...parsed, signature: parsed.signature.slice(0, -6) + "BADSIG==" };
    setEditedJson(JSON.stringify(modified, null, 2));
  };

  const tamperNonce = () => {
    if (!parsed) return;
    const modified = { ...parsed, nonce: "nc_tampered_replay_12345" };
    setEditedJson(JSON.stringify(modified, null, 2));
  };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Security center</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Offline payments cannot ask a server for permission, so trust has to travel inside the payload. Here is what
        Kauri Pay checks, and where the honest limits are.
      </p>

      {/* Interactive Cryptographic Tampering Sandbox */}
      <Panel className="mt-6 border-blue-500/30 bg-blue-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-blue-400" />
              <h2 className="font-display text-lg font-semibold text-foreground">Interactive Cryptographic Tamper Sandbox</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Edit the transaction JSON directly or use quick-tamper buttons to observe live Ed25519 signature verification failure.
            </p>
          </div>
          <button
            onClick={resetSandbox}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold hover:bg-secondary/70"
          >
            <RotateCcw className="size-3.5" /> Restore Valid Signature
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payload JSON (Editable)</label>
            <textarea
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-input bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-blue-200 outline-none focus:border-primary"
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                onClick={tamperAmount}
                className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/20"
              >
                Tamper Amount (₹250 → ₹25,000)
              </button>
              <button
                onClick={corruptSig}
                className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
              >
                Corrupt Signature
              </button>
              <button
                onClick={tamperNonce}
                className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 hover:bg-purple-500/20"
              >
                Modify Nonce
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-slate-950/60 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Verification Status</p>
              {parseError ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/15 p-3 text-xs text-destructive">
                  <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">JSON Syntax Error</span>
                    <span>The raw payload string is not valid JSON.</span>
                  </div>
                </div>
              ) : isSigValid ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Ed25519 Signature Verified!</span>
                    <span>The payload data exactly matches the digital signature produced by public key <code className="font-mono text-[10px] text-emerald-300">{parsed?.publicKey}</code>.</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/15 p-3 text-xs text-destructive">
                  <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Signature Verification Failed!</span>
                    <span>The signature does not match the payload attributes. Tampering detected! Merchants will reject this transaction offline.</span>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-muted-foreground">Canonicalized Data</span>
                  <span className="font-mono text-[11px] text-slate-300 max-w-[200px] truncate">
                    {parsed ? [parsed.txnId, parsed.amount, parsed.payerVpa, parsed.merchantId, parsed.nonce, parsed.timestamp].join("|") : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-muted-foreground">Attached Signature</span>
                  <span className="font-mono text-[11px] text-slate-300 max-w-[200px] truncate">
                    {parsed?.signature ?? "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic mt-4 pt-3 border-t border-slate-800">
              * Try editing the amount or nonce in the text area on the left to see how cryptographic hashes immediately detect unauthorized payload modifications without internet connectivity.
            </p>
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Panel key={c.title} className="transition-transform hover:-translate-y-0.5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <c.icon className="size-5" />
            </span>
            <h2 className="font-display mt-4 text-lg font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-6 border-warning/30 bg-warning/5">
        <p className="flex items-center gap-2 font-semibold text-warning">
          <AlertTriangle className="size-4" /> Prototype disclaimer — double spending
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A fully offline payer can, in principle, present the same pre-funded balance to two merchants who cannot talk
          to each other. Kauri Pay mitigates rather than eliminates this: pre-funded offline balances, low per-payment
          caps, a bounded freshness window, per-device nonce registries, and server-side reconciliation that flags
          conflicting spends at sync time and settles only the first valid claim. In this hackathon prototype the Ed25519
          signing, key storage and central ledger are simulated in the browser with LocalStorage — no real funds,
          hardware-backed keys or bank rails are involved.
        </p>
      </Panel>
    </AppShell>
  );
}
