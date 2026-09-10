import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { useKauri } from "@/lib/kauri/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Hackathon Demo Mode — Kauri Pay" },
      { name: "description", content: "A guided ten-step walkthrough of an offline Kauri Pay payment, from signing to settlement." },
      { property: "og:title", content: "Hackathon Demo Mode — Kauri Pay" },
      { property: "og:description", content: "Step judges through offline signing, QR transfer, local verification and sync settlement." },
    ],
  }),
  component: DemoMode,
});

type Step = {
  title: string;
  body: string;
  device?: "user" | "merchant";
  connection?: "online" | "offline" | "syncing";
};

const STEPS: Step[] = [
  {
    title: "User goes offline",
    body: "Rahul is in a low-coverage area. The wallet switches to Offline Mode and works from a pre-funded offline balance of ₹2,500.",
    device: "user",
    connection: "offline",
  },
  {
    title: "Payment created & signed",
    body: "He enters ₹250 for Sharma Store. The device mints a transaction ID, a single-use nonce and a timestamp, then signs the payload with its Ed25519 key.",
    device: "user",
    connection: "offline",
  },
  {
    title: "QR generated",
    body: "The signed JSON payload is encoded into a QR code — the QR is the transport, so no network hop is needed.",
    device: "user",
    connection: "offline",
  },
  {
    title: "Merchant scans",
    body: "Sharma Store's till scans the QR (or quick-pastes the demo payload) and decodes the structured payment.",
    device: "merchant",
    connection: "offline",
  },
  {
    title: "Verified offline",
    body: "Four local checks pass: signature valid, nonce unused, timestamp fresh, amount within the offline cap.",
    device: "merchant",
    connection: "offline",
  },
  {
    title: "Payment accepted",
    body: "The merchant accepts. Balance rises to ₹8,700 and the payer's offline balance drops to ₹2,250.",
    device: "merchant",
    connection: "offline",
  },
  {
    title: "Local ledger updated",
    body: "The entry is written to LocalStorage as Pending sync with its full cryptographic detail, surviving app restarts.",
    device: "merchant",
    connection: "offline",
  },
  {
    title: "Connectivity restored",
    body: "Coverage returns. A Connection Restored banner appears with a count of payments waiting to settle.",
    device: "merchant",
    connection: "online",
  },
  {
    title: "Sync & reconciliation",
    body: "The five-step reconciliation runs: read ledger, verify signatures, check nonces and replay, reconcile centrally, settle.",
    device: "merchant",
    connection: "syncing",
  },
  {
    title: "Settlement complete",
    body: "Every entry flips from Pending sync to Synced. The offline window closed with no lost sale and no double spend.",
    device: "merchant",
    connection: "online",
  },
];

function DemoMode() {
  const { setDevice, setConnection } = useKauri();
  const [current, setCurrent] = useState(-1);

  const go = (i: number) => {
    const step = STEPS[i];
    if (!step) return;
    setCurrent(i);
    if (step.device) setDevice(step.device);
    if (step.connection) setConnection(step.connection);
  };

  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Hackathon demo mode</h1>
          <p className="text-sm text-muted-foreground">
            Ten one-click steps through a full offline payment. Device and connection state follow each step.
          </p>
        </div>
        <ConnectionBadge />
      </div>

      <Panel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Step {Math.max(0, current + 1)} of {STEPS.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => go(current + 1)}
              disabled={current >= STEPS.length - 1}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              style={{ background: "var(--gradient-accent)" }}
            >
              {current < 0 ? "Start walkthrough" : "Next step"} <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => {
                setCurrent(-1);
                setDevice("user");
                setConnection("offline");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold"
            >
              <RotateCcw className="size-4" /> Restart
            </button>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--gradient-accent)" }}
          />
        </div>
      </Panel>

      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.title}>
              <button
                onClick={() => go(i)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-primary/50 bg-primary/10 shadow-[var(--shadow-glow)]"
                    : done
                      ? "border-success/25 bg-success/5"
                      : "border-border bg-card/50 opacity-70 hover:opacity-100",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-success text-success-foreground"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{s.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
