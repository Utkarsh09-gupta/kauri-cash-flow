import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Printer, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatINR, canonicalize } from "@/lib/kauri/crypto";
import type { Txn } from "@/lib/kauri/types";

interface ReceiptModalProps {
  txn: Txn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptModal({ txn, open, onOpenChange }: ReceiptModalProps) {
  if (!txn) return null;

  const formattedDate = new Date(txn.timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const canonicalString = canonicalize(txn);

  const handleCopyText = () => {
    const text = `--- KAURI PAY DIGITAL RECEIPT ---
Txn ID: ${txn.txnId}
Amount: ${formatINR(txn.amount)}
Payer: ${txn.payer} (${txn.payerVpa})
Merchant: ${txn.merchant} (${txn.merchantId})
Status: ${txn.status}
Timestamp: ${formattedDate}
Nonce: ${txn.nonce}
Ed25519 Signature: ${txn.signature}
Public Key: ${txn.publicKey}
---------------------------------`;

    navigator.clipboard.writeText(text);
    toast.success("Receipt text copied to clipboard!");
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(txn, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${txn.txnId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Receipt downloaded: Receipt-${txn.txnId}.json`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="text-center sm:text-center pb-3 border-b border-slate-800">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white">Digital Payment Receipt</DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Cryptographically signed offline payment token
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 text-sm">
          {/* Amount Hero */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Amount Paid</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{formatINR(txn.amount)}</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {txn.status === "synced" ? "Synced with Ledger" : "Verified Offline"}
              </Badge>
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono font-semibold text-slate-200">{txn.txnId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Payer</span>
              <span className="text-slate-200 font-medium">{txn.payer} ({txn.payerVpa})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Merchant</span>
              <span className="text-slate-200 font-medium">{txn.merchant}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Date & Time</span>
              <span className="text-slate-200">{formattedDate}</span>
            </div>
            {txn.note && (
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Note</span>
                <span className="text-slate-200 italic">{txn.note}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Nonce</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]">{txn.nonce}</span>
            </div>
          </div>

          {/* Cryptographic Signature Box */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/90 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-[11px] uppercase tracking-wider text-blue-400">Ed25519 Signature Proof</span>
              <span className="text-[10px] text-slate-500">Alg: Ed25519</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800">
              {txn.signature}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
              Canonical string: {canonicalString}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="flex-1 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJSON}
            className="flex-1 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download JSON
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
