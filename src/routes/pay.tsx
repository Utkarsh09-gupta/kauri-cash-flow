import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { PaymentQR } from "@/components/kauri/PaymentQR";
import { useKauri } from "@/lib/kauri/store";
import { formatINR, txnToPayload } from "@/lib/kauri/crypto";
import { MERCHANTS, OFFLINE_TXN_LIMIT, type Txn } from "@/lib/kauri/types";
import { playErrorSound } from "@/lib/kauri/audio";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Create Offline Payment — Kauri Pay" },
      { name: "description", content: "Pick a merchant, enter an amount and mint an Ed25519-signed offline payment QR code." },
      { property: "og:title", content: "Create Offline Payment — Kauri Pay" },
      { property: "og:description", content: "Mint a signed offline payment with transaction ID, nonce, timestamp and signature." },
    ],
  }),
  component: PayScreen,
});

function PayScreen() {
  const { state, createPayment, remainingOfflineLimit } = useKauri();
  const [merchantId, setMerchantId] = useState(MERCHANTS[0]!.id);
  const [amount, setAmount] = useState("250");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [txn, setTxn] = useState<Txn | null>(null);

  const value = Number(amount);

  const submit = () => {
    setError(null);
    if (!amount || Number.isNaN(value) || value <= 0) {
      playErrorSound(state.soundEnabled);
      return setError("Enter a valid amount greater than ₹0.");
    }
    if (value > OFFLINE_TXN_LIMIT) {
      playErrorSound(state.soundEnabled);
      return setError(`Offline transactions are capped at ${formatINR(OFFLINE_TXN_LIMIT)} per payment.`);
    }
    if (value > remainingOfflineLimit) {
      playErrorSound(state.soundEnabled);
      return setError(`Cumulative offline limit exceeded. Remaining allowance: ${formatINR(remainingOfflineLimit)}.`);
    }
    if (value > state.userBalance) {
      playErrorSound(state.soundEnabled);
      return setError(`Insufficient offline balance. Available: ${formatINR(state.userBalance)}.`);
    }

    setBusy(true);
    const merchant = MERCHANTS.find((m) => m.id === merchantId)!;
    setTimeout(() => {
      const created = createPayment({
        amount: value,
        ...(note.trim() ? { note: note.trim() } : {}),
        merchantId: merchant.id,
        merchantName: merchant.name,
      });
      setTxn(created);
      setBusy(false);
    }, 700);
  };

  const payloadJson = txn ? JSON.stringify(txnToPayload(txn), null, 2) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(txnToPayload(txn!)));
      toast.success("Demo payload copied — paste it on the merchant device.");
    } catch {
      toast.error("Clipboard blocked. Select the payload text and copy manually.");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Send payment</h1>
        <ConnectionBadge />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="text-sm text-muted-foreground">Available offline balance</p>
          <p className="font-display text-2xl font-semibold">{formatINR(state.userBalance)}</p>

          <label className="mt-5 block text-sm font-medium">Merchant</label>
          <select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {MERCHANTS.map((m) => (
              <option key={m.id} value={m.id} className="bg-card">
                {m.name} — {m.id}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium">Amount (₹)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            className="font-display mt-1.5 w-full rounded-xl border border-input bg-secondary/40 px-3 py-3 text-2xl font-semibold outline-none focus:border-primary"
          />
          <div className="mt-2 flex gap-2">
            {[100, 250, 500, 1000].map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ₹{q}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Groceries, chai, bus ticket…"
            className="mt-1.5 w-full rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
          />

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-70"
            style={{ background: "var(--gradient-accent)" }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {busy ? "Signing with Ed25519 key…" : "Create offline payment"}
          </button>
        </Panel>

        <Panel>
          {!txn ? (
            <div className="grid h-full min-h-[320px] place-items-center text-center">
              <div>
                <p className="text-sm font-semibold">Payment QR appears here</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  The QR carries a structured JSON payload with transaction ID, nonce, timestamp and detached signature.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-success">
                <Check className="size-4" /> Signed offline · {formatINR(txn.amount)} to {txn.merchant}
              </div>
              <div className="mt-4 flex justify-center">
                <PaymentQR value={JSON.stringify(txnToPayload(txn))} />
              </div>
              <dl className="mt-4 space-y-1.5 text-xs">
                {[
                  ["Transaction ID", txn.txnId],
                  ["Nonce", txn.nonce],
                  ["Timestamp", new Date(txn.timestamp).toISOString()],
                  ["Ed25519 signature", txn.signature],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="break-all font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
              <pre className="mt-4 max-h-40 overflow-auto rounded-xl border border-border bg-secondary/40 p-3 text-[11px] leading-relaxed">
                {payloadJson}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
                >
                  <Copy className="size-4" /> Copy demo payload
                </button>
                <Link
                  to="/scan"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Open merchant scanner
                </Link>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
