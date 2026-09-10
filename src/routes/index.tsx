import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Smartphone, Store, ShieldCheck, WifiOff, QrCode, ArrowRight } from "lucide-react";
import { AppShell, Panel } from "@/components/kauri/AppShell";
import { useKauri } from "@/lib/kauri/store";
import { formatINR } from "@/lib/kauri/crypto";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kauri Pay — Offline-First Digital Payments" },
      {
        name: "description",
        content:
          "Kauri Pay is an offline-first payment prototype: cryptographically signed QR payments that clear without internet and reconcile on reconnect.",
      },
      { property: "og:title", content: "Kauri Pay — Offline-First Digital Payments" },
      {
        property: "og:description",
        content: "Sign, scan and verify small-value payments with zero connectivity, then settle when you're back online.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { chooseRole, state } = useKauri();
  const navigate = useNavigate();

  const pick = (role: "user" | "merchant") => {
    chooseRole(role);
    navigate({ to: role === "user" ? "/user" : "/merchant" });
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <WifiOff className="size-3.5" /> Works with zero connectivity
        </span>
        <h1 className="font-display mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Payments that don't wait
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          >
            for a network
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Kauri Pay signs small-value transactions on-device with Ed25519, transfers them over a QR code, verifies them
          locally at the merchant, and reconciles with the central ledger the moment connectivity returns.
        </p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button onClick={() => pick("user")} className="text-left transition-transform hover:-translate-y-1">
          <Panel className="h-full border-primary/25">
            <Smartphone className="size-7 text-primary" />
            <h2 className="font-display mt-4 text-xl font-semibold">Continue as User</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rahul Verma · offline balance {formatINR(state.userBalance)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Create a signed offline payment and show it as a QR code.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Open user device <ArrowRight className="size-4" />
            </span>
          </Panel>
        </button>
        <button onClick={() => pick("merchant")} className="text-left transition-transform hover:-translate-y-1">
          <Panel className="h-full border-accent/25">
            <Store className="size-7 text-accent" />
            <h2 className="font-display mt-4 text-xl font-semibold">Continue as Merchant</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sharma Store · balance {formatINR(state.merchantBalance)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Scan, verify offline and accept payments into a local ledger.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              Open merchant device <ArrowRight className="size-4" />
            </span>
          </Panel>
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { icon: QrCode, title: "QR as the transport", body: "A structured signed JSON payload travels device to device." },
          { icon: ShieldCheck, title: "Verified on the spot", body: "Signature, nonce, timestamp and limits checked offline." },
          { icon: WifiOff, title: "Settled on reconnect", body: "A five-step reconciliation clears the local ledger." },
        ].map((f) => (
          <Panel key={f.title} className="bg-card/50">
            <f.icon className="size-5 text-accent" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </Panel>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Judging this?{" "}
        <Link to="/demo" className="font-semibold text-primary underline-offset-4 hover:underline">
          Step through the guided demo
        </Link>
      </p>
    </AppShell>
  );
}
