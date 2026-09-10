import { Link, useRouterState } from "@tanstack/react-router";
import { Wifi, WifiOff, RefreshCw, Smartphone, Store, RotateCcw, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useKauri } from "@/lib/kauri/store";
import { formatINR } from "@/lib/kauri/crypto";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/user", label: "User" },
  { to: "/merchant", label: "Merchant" },
  { to: "/transactions", label: "Ledger" },
  { to: "/demo", label: "Demo Mode" },
  { to: "/security", label: "Security" },
] as const;

export function ConnectionBadge({ className }: { className?: string }) {
  const { state } = useKauri();
  const map = {
    online: { text: "🟢 Online", cls: "bg-success/15 text-success border-success/30" },
    offline: { text: "🟠 Offline Mode", cls: "bg-warning/15 text-warning border-warning/30" },
    syncing: { text: "🔵 Syncing", cls: "bg-primary/15 text-primary border-primary/30" },
  }[state.connection];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        map.cls,
        className,
      )}
    >
      {map.text}
    </span>
  );
}

function ConnectionToggle() {
  const { state, setConnection } = useKauri();
  const options = [
    { key: "online" as const, icon: Wifi, label: "Online" },
    { key: "offline" as const, icon: WifiOff, label: "Offline" },
    { key: "syncing" as const, icon: RefreshCw, label: "Syncing" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setConnection(o.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
            state.connection === o.key
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <o.icon className={cn("size-3.5", o.key === "syncing" && state.connection === "syncing" && "animate-spin")} />
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DeviceSwitcher() {
  const { state, setDevice } = useKauri();
  const devices = [
    { key: "user" as const, icon: Smartphone, label: "User Device", sub: "Rahul" },
    { key: "merchant" as const, icon: Store, label: "Merchant Device", sub: "Sharma Store" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
      {devices.map((d) => (
        <button
          key={d.key}
          onClick={() => setDevice(d.key)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
            state.device === d.key
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <d.icon className="size-3.5" />
          <span className="hidden sm:inline">{d.label}</span>
          <span className="sm:hidden">{d.sub}</span>
        </button>
      ))}
    </div>
  );
}

function RestoredBanner() {
  const { state } = useKauri();
  const [dismissed, setDismissed] = useState(false);
  const [prev, setPrev] = useState(state.connection);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prev === "offline" && state.connection === "online") {
      setShow(true);
      setDismissed(false);
    }
    if (state.connection === "offline") setShow(false);
    setPrev(state.connection);
  }, [state.connection, prev]);

  const pending = state.txns.filter((t) => t.status === "pending_sync").length;
  if (!show || dismissed) return null;

  return (
    <div className="animate-fade-in border-b border-success/25 bg-success/10">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm">
        <Wifi className="size-4 shrink-0 text-success" />
        <p className="flex-1 text-foreground">
          <span className="font-semibold">Connection restored.</span>{" "}
          {pending > 0
            ? `${pending} offline payment${pending > 1 ? "s" : ""} ready to reconcile with the central ledger.`
            : "Everything is already settled."}
        </p>
        {pending > 0 && (
          <Link
            to="/transactions"
            className="rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground"
          >
            Sync now
          </Link>
        )}
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, reset } = useKauri();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const balance = state.device === "user" ? state.userBalance : state.merchantBalance;

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px]" style={{ background: "var(--gradient-hero)" }} />
      <header className="relative z-10 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="grid size-9 place-items-center rounded-xl text-sm font-bold text-primary-foreground"
              style={{ background: "var(--gradient-accent)" }}
            >
              K
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Kauri Pay</span>
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DeviceSwitcher />
            <ConnectionToggle />
            <ConnectionBadge />
            <button
              onClick={reset}
              title="Reset demo data"
              className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === n.to
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
          <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
            {state.device === "user" ? "Rahul" : "Sharma Store"} · {formatINR(balance)}
          </span>
        </div>
      </header>
      <RestoredBanner />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="relative z-10 border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        Kauri Pay — hackathon prototype. Cryptography is simulated for demonstration purposes.
      </footer>
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/80 p-5 shadow-[var(--shadow-elevated)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
