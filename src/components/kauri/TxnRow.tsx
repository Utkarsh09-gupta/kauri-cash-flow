import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Hash, KeyRound, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/kauri/crypto";
import { STATUS_LABEL, type Txn, type TxnStatus } from "@/lib/kauri/types";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: TxnStatus }) {
  const cls: Record<TxnStatus, string> = {
    pending_verification: "bg-muted text-muted-foreground border-border",
    verified_offline: "bg-accent/15 text-accent border-accent/30",
    pending_sync: "bg-warning/15 text-warning border-warning/30",
    synced: "bg-success/15 text-success border-success/30",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TxnRow({ txn, perspective }: { txn: Txn; perspective: "user" | "merchant" }) {
  const [open, setOpen] = useState(false);
  const incoming = perspective === "merchant";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            incoming ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
          )}
        >
          {incoming ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{incoming ? txn.payer : txn.merchant}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {txn.txnId} · {new Date(txn.timestamp).toLocaleString("en-IN")}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-sm font-semibold">
            {incoming ? "+" : "−"}
            {formatINR(txn.amount)}
          </span>
          <span className="mt-1 block">
            <StatusPill status={txn.status} />
          </span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Transaction detail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-semibold">{formatINR(txn.amount)}</span>
              <StatusPill status={txn.status} />
            </div>
            <dl className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
              {[
                ["Payer", `${txn.payer} (${txn.payerVpa})`],
                ["Merchant", `${txn.merchant} (${txn.merchantId})`],
                ["Note", txn.note || "—"],
                ["Created", new Date(txn.timestamp).toLocaleString("en-IN")],
                ["Accepted offline", txn.acceptedAt ? new Date(txn.acceptedAt).toLocaleString("en-IN") : "—"],
                ["Settled", txn.syncedAt ? new Date(txn.syncedAt).toLocaleString("en-IN") : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cryptographic details
              </p>
              <Detail icon={Hash} label="Transaction ID" value={txn.txnId} />
              <Detail icon={Clock} label="Nonce" value={txn.nonce} />
              <Detail icon={KeyRound} label="Ed25519 signature" value={txn.signature} />
              <Detail icon={KeyRound} label="Device public key" value={txn.publicKey} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-0.5 break-all font-mono text-xs">{value}</p>
    </div>
  );
}
