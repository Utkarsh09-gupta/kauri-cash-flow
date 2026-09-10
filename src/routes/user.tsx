import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, QrCode, ScanLine, ShieldCheck, ReceiptText, WifiOff } from "lucide-react";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { TxnRow } from "@/components/kauri/TxnRow";
import { useKauri } from "@/lib/kauri/store";
import { formatINR } from "@/lib/kauri/crypto";
import { OFFLINE_TXN_LIMIT, USER } from "@/lib/kauri/types";

export const Route = createFileRoute("/user")({
  head: () => ({
    meta: [
      { title: "User Device — Kauri Pay" },
      { name: "description", content: "Rahul's offline wallet: available offline balance, quick actions and recent signed payments." },
      { property: "og:title", content: "User Device — Kauri Pay" },
      { property: "og:description", content: "Offline balance, quick actions and recent signed payments on the Kauri Pay user device." },
    ],
  }),
  component: UserDashboard,
});

const ACTIONS = [
  { to: "/pay", label: "Pay", icon: ArrowUpRight },
  { to: "/myqr", label: "My QR", icon: QrCode },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/security", label: "Security", icon: ShieldCheck },
] as const;

function UserDashboard() {
  const { state, cumulativeOfflineSpent, remainingOfflineLimit } = useKauri();
  const mine = state.txns.filter((t) => t.payerVpa === USER.vpa).slice(0, 5);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">User device</p>
          <h1 className="font-display text-2xl font-semibold">{USER.name}</h1>
        </div>
        <ConnectionBadge />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" >
          <p className="text-sm text-muted-foreground">Available offline balance</p>
          <p className="font-display mt-1 text-4xl font-semibold tracking-tight">{formatINR(state.userBalance)}</p>
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium">Offline Cumulative Allowance</span>
              <span className="font-semibold text-foreground">
                {formatINR(cumulativeOfflineSpent)} / {formatINR(state.maxOfflineCumulativeLimit)}
              </span>
            </div>
            <div className="w-full bg-secondary/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(100, (cumulativeOfflineSpent / state.maxOfflineCumulativeLimit) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <WifiOff className="size-3 text-warning" /> Signed on-device · {formatINR(remainingOfflineLimit)} remaining before central sync
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/pay"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ background: "var(--gradient-accent)" }}
            >
              Create offline payment
            </Link>
            <Link to="/myqr" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
              Show my QR
            </Link>
          </div>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Quick actions</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/70"
              >
                <a.icon className="size-4 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Recent transactions</p>
          <Link to="/transactions" className="text-xs font-semibold text-primary">
            View ledger
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {mine.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No offline payments yet — create your first one.
            </p>
          )}
          {mine.map((t) => (
            <TxnRow key={t.txnId} txn={t} perspective="user" />
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
