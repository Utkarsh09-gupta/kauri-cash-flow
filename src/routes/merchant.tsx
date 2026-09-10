import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, ReceiptText, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { TxnRow } from "@/components/kauri/TxnRow";
import { useKauri, useLedgerCounts } from "@/lib/kauri/store";
import { formatINR } from "@/lib/kauri/crypto";
import { STATUS_LABEL } from "@/lib/kauri/types";

export const Route = createFileRoute("/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant Device — Kauri Pay" },
      { name: "description", content: "Sharma Store's offline till: balance, ledger breakdown and locally verified payments." },
      { property: "og:title", content: "Merchant Device — Kauri Pay" },
      { property: "og:description", content: "Accept and verify offline payments, then track pending sync and settled entries." },
    ],
  }),
  component: MerchantDashboard,
});

function MerchantDashboard() {
  const { state } = useKauri();
  const counts = useLedgerCounts();
  const recent = state.txns.slice(0, 6);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Merchant device</p>
          <h1 className="font-display text-2xl font-semibold">Sharma Store</h1>
        </div>
        <ConnectionBadge />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">Merchant balance</p>
          <p className="font-display mt-1 text-4xl font-semibold tracking-tight">{formatINR(state.merchantBalance)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-accent)" }}
            >
              <ScanLine className="size-4" /> Scan payment
            </Link>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
            >
              <ReceiptText className="size-4" /> Local ledger
            </Link>
            <Link
              to="/security"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
            >
              <ShieldCheck className="size-4" /> Security
            </Link>
          </div>
        </Panel>
        <Panel>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <RefreshCw className="size-4 text-primary" /> Offline payments ledger
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            {(["pending_verification", "verified_offline", "pending_sync", "synced"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                <dt className="text-muted-foreground">{STATUS_LABEL[k]}</dt>
                <dd className="font-display text-lg font-semibold">{counts[k]}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel className="mt-4">
        <p className="font-semibold">Recently accepted</p>
        <div className="mt-3 space-y-2">
          {recent.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payments yet — scan an offline payment QR to get started.
            </p>
          )}
          {recent.map((t) => (
            <TxnRow key={t.txnId} txn={t} perspective="merchant" />
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
