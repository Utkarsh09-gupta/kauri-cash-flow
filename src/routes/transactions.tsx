import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { TxnRow } from "@/components/kauri/TxnRow";
import { useKauri } from "@/lib/kauri/store";
import { STATUS_LABEL, type TxnStatus } from "@/lib/kauri/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Local Ledger & Sync — Kauri Pay" },
      { name: "description", content: "Browse the offline transaction ledger, inspect cryptographic details and run the five-step reconciliation." },
      { property: "og:title", content: "Local Ledger & Sync — Kauri Pay" },
      { property: "og:description", content: "Filter offline payments and settle them with an animated reconciliation flow." },
    ],
  }),
  component: Ledger,
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "verified_offline", label: STATUS_LABEL.verified_offline },
  { key: "pending_sync", label: STATUS_LABEL.pending_sync },
  { key: "synced", label: STATUS_LABEL.synced },
] as const;

const STEPS = [
  "Reading local ledger",
  "Verifying cryptographic signatures",
  "Checking nonces & replay protection",
  "Reconciling with central ledger",
  "Settlement complete",
];

function Ledger() {
  const { state, markSynced, setConnection } = useKauri();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);

  const pending = state.txns.filter((t) => t.status === "pending_sync");
  const list =
    filter === "all" ? state.txns : state.txns.filter((t) => t.status === (filter as TxnStatus));

  const sync = () => {
    if (running || pending.length === 0) return;
    setRunning(true);
    setConnection("syncing");
    setStep(0);
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStep(i);
        if (i === STEPS.length - 1) {
          markSynced();
          setRunning(false);
        }
      }, 900 * (i + 1));
    });
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Local transaction ledger</h1>
        <ConnectionBadge />
      </div>

      <Panel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Synchronization</p>
            <p className="text-sm text-muted-foreground">
              {pending.length > 0
                ? `${pending.length} payment${pending.length > 1 ? "s" : ""} awaiting settlement with the central ledger.`
                : "Nothing pending — the local ledger matches the central ledger."}
            </p>
          </div>
          <button
            onClick={sync}
            disabled={running || pending.length === 0}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            style={{ background: "var(--gradient-accent)" }}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Sync transactions
          </button>
        </div>

        {step >= 0 && (
          <ol className="animate-fade-in mt-5 space-y-2">
            {STEPS.map((s, i) => {
              const done = i < step || (!running && i <= step);
              const active = running && i === step;
              return (
                <li
                  key={s}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                    done
                      ? "border-success/30 bg-success/10"
                      : active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-secondary/30 opacity-60",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-[11px] font-semibold">
                    {done ? <Check className="size-3.5 text-success" /> : active ? <Loader2 className="size-3.5 animate-spin text-primary" /> : i + 1}
                  </span>
                  {s}
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Panel className="mt-4">
        <div className="space-y-2">
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions in this view.</p>
          )}
          {list.map((t) => (
            <TxnRow key={t.txnId} txn={t} perspective={state.device} />
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
