import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock, Database, Fingerprint, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell, Panel } from "@/components/kauri/AppShell";
import { OFFLINE_TXN_LIMIT } from "@/lib/kauri/types";
import { formatINR } from "@/lib/kauri/crypto";

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

function SecurityCenter() {
  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Security center</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Offline payments cannot ask a server for permission, so trust has to travel inside the payload. Here is what
        Kauri Pay checks, and where the honest limits are.
      </p>

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
