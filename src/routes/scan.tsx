import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, Check, ClipboardPaste, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ConnectionBadge, Panel } from "@/components/kauri/AppShell";
import { useKauri } from "@/lib/kauri/store";
import { formatINR, parsePayload, txnToPayload, verifySignature } from "@/lib/kauri/crypto";
import { OFFLINE_TXN_LIMIT, TIMESTAMP_WINDOW_MS, type Payload, type Txn } from "@/lib/kauri/types";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan & Verify Payment — Kauri Pay" },
      { name: "description", content: "Scan an offline payment QR or paste the payload, then run local signature, nonce and freshness checks." },
      { property: "og:title", content: "Scan & Verify Payment — Kauri Pay" },
      { property: "og:description", content: "Verify signature, nonce uniqueness, timestamp freshness and limits without any network." },
    ],
  }),
  component: ScanScreen,
});

type Check = { label: string; ok: boolean; detail: string };

function runChecks(p: Payload, usedNonces: string[]): Check[] {
  const age = Date.now() - p.timestamp;
  return [
    {
      label: "Signature valid (Ed25519)",
      ok: verifySignature(p),
      detail: `${p.signature.slice(0, 22)}… verified against ${p.publicKey?.slice(0, 18) ?? "device key"}…`,
    },
    {
      label: "Nonce unique (no replay)",
      ok: !usedNonces.includes(p.nonce),
      detail: usedNonces.includes(p.nonce) ? `Nonce ${p.nonce} already spent on this device` : p.nonce,
    },
    {
      label: "Timestamp fresh",
      ok: age >= -60_000 && age <= TIMESTAMP_WINDOW_MS,
      detail: `Created ${Math.max(0, Math.round(age / 1000))}s ago · window 24h`,
    },
    {
      label: "Amount within offline limit",
      ok: p.amount > 0 && p.amount <= OFFLINE_TXN_LIMIT,
      detail: `${formatINR(p.amount)} of ${formatINR(OFFLINE_TXN_LIMIT)} per-payment cap`,
    },
  ];
}

function ScanScreen() {
  const { state, acceptPayment } = useKauri();
  const [raw, setRaw] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const verify = (input: string) => {
    setError(null);
    setAccepted(false);
    const parsed = parsePayload(input);
    if (!parsed.ok) {
      setPayload(null);
      setChecks(null);
      setError(parsed.error);
      return;
    }
    setVerifying(true);
    setPayload(parsed.payload);
    setChecks(null);
    setTimeout(() => {
      setChecks(runChecks(parsed.payload, state.usedNonces));
      setVerifying(false);
    }, 800);
  };

  const allOk = !!checks && checks.every((c) => c.ok);

  const accept = () => {
    if (!payload || !allOk) return;
    const existing = state.txns.find((t) => t.txnId === payload.txnId);
    const txn: Txn = {
      ...(existing ?? {
        txnId: payload.txnId,
        amount: payload.amount,
        note: payload.note,
        payer: payload.payer,
        payerVpa: payload.payerVpa,
        merchant: payload.merchant,
        merchantId: payload.merchantId,
        nonce: payload.nonce,
        timestamp: payload.timestamp,
        signature: payload.signature,
        publicKey: payload.publicKey,
        status: "verified_offline",
      }),
    };
    acceptPayment(txn);
    setAccepted(true);
    toast.success(`${formatINR(txn.amount)} accepted offline — logged as Pending sync.`);
  };

  const pasteDemo = async () => {
    const latest = state.txns.find((t) => t.status === "pending_verification");
    if (!latest) {
      toast.error("No unspent offline payment on the user device. Create one first.");
      return;
    }
    const json = JSON.stringify(txnToPayload(latest));
    setRaw(json);
    verify(json);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Scan payment</h1>
        <ConnectionBadge />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <CameraScanner onDetected={(text) => { setRaw(text); verify(text); }} />
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">Manual / demo payload</p>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={5}
              placeholder='Paste the signed JSON payload here, e.g. {"txnId":"KP-…","amount":250,…}'
              className="w-full rounded-xl border border-input bg-secondary/40 p-3 font-mono text-[11px] outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => verify(raw)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-accent)" }}
              >
                Verify payload
              </button>
              <button
                onClick={pasteDemo}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                <ClipboardPaste className="size-4" /> Quick-paste demo payment
              </button>
            </div>
            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold">Local verification checklist</p>
          {!payload && !verifying && (
            <p className="mt-4 text-sm text-muted-foreground">
              Scan or paste a payment to run offline checks. No network calls are made.
            </p>
          )}
          {verifying && (
            <p className="mt-4 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="size-4 animate-spin" /> Running local cryptographic checks…
            </p>
          )}
          {payload && checks && (
            <div className="animate-fade-in mt-4">
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="font-display text-2xl font-semibold">{formatINR(payload.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  from {payload.payer} ({payload.payerVpa})
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{payload.txnId}</p>
                {payload.note && <p className="mt-1 text-sm">“{payload.note}”</p>}
              </div>
              <ul className="mt-4 space-y-2">
                {checks.map((c) => (
                  <li
                    key={c.label}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      c.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                        c.ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {c.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{c.label}</span>
                      <span className="block break-all text-xs text-muted-foreground">{c.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {accepted ? (
                <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-3 text-sm">
                  <p className="font-semibold text-success">Payment accepted offline</p>
                  <p className="mt-1 text-muted-foreground">
                    Logged to the local ledger as Pending sync. Merchant balance is now{" "}
                    {formatINR(state.merchantBalance)}.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link to="/transactions" className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                      Open ledger
                    </Link>
                    <Link to="/merchant" className="rounded-full border border-border px-4 py-2 text-xs font-semibold">
                      Merchant dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  onClick={accept}
                  disabled={!allOk}
                  className="mt-4 w-full rounded-full bg-success px-5 py-3 text-sm font-semibold text-success-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {allOk ? "Accept payment" : "Cannot accept — a check failed"}
                </button>
              )}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function CameraScanner({ onDetected }: { onDetected: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");

    (async () => {
      const jsQR = (await import("jsqr")).default;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const tick = () => {
        if (stopped) return;
        const ctx = canvas.getContext("2d");
        if (ctx && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height);
          if (code?.data) {
            onDetected(code.data);
            setOn(false);
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })().catch(() => setErr("Camera unavailable — use the manual payload below."));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, onDetected]);

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary/40">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        {!on && (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <CameraOff className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Camera is off</p>
            </div>
          </div>
        )}
        {on && (
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-accent/70 shadow-[var(--shadow-glow)]" />
        )}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
      >
        <Camera className="size-4" /> {on ? "Stop camera" : "Start camera scanner"}
      </button>
      {err && <p className="mt-2 text-xs text-warning">{err}</p>}
    </div>
  );
}
