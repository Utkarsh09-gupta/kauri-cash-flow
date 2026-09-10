import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { PaymentQR } from "@/components/kauri/PaymentQR";
import { DEVICE_PUBLIC_KEY, formatINR } from "@/lib/kauri/crypto";
import { useKauri } from "@/lib/kauri/store";
import { USER } from "@/lib/kauri/types";

export const Route = createFileRoute("/myqr")({
  head: () => ({
    meta: [
      { title: "My Offline QR — Kauri Pay" },
      { name: "description", content: "Rahul's device identity QR: wallet handle and Ed25519 public key for offline verification." },
      { property: "og:title", content: "My Offline QR — Kauri Pay" },
      { property: "og:description", content: "Share your wallet handle and device public key so merchants can verify you offline." },
    ],
  }),
  component: MyQR,
});

function MyQR() {
  const { state } = useKauri();
  const identity = JSON.stringify({
    v: 1,
    type: "identity",
    name: USER.name,
    vpa: USER.vpa,
    publicKey: DEVICE_PUBLIC_KEY,
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">My QR</h1>
        <ConnectionBadge />
      </div>
      <Panel className="mx-auto mt-6 max-w-md text-center">
        <p className="text-sm text-muted-foreground">Wallet handle</p>
        <p className="font-display text-xl font-semibold">{USER.vpa}</p>
        <div className="mt-5 flex justify-center">
          <PaymentQR value={identity} size={220} />
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          {USER.name} · offline balance {formatINR(state.userBalance)}
        </p>
        <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">{DEVICE_PUBLIC_KEY}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          This QR carries only your handle and device public key — merchants use it to verify your signatures while both
          devices are offline.
        </p>
      </Panel>
    </AppShell>
  );
}
