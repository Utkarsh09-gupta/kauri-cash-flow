import { useEffect, useState } from "react";

export function PaymentQR({ value, size = 240 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const url = await QR.toDataURL(value, {
        width: size * 2,
        margin: 1,
        errorCorrectionLevel: "L",
        color: { dark: "#0A1128", light: "#FFFFFF" },
      });
      if (!cancelled) setSrc(url);
    })().catch(() => setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className="grid place-items-center rounded-2xl bg-white p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {src ? (
        <img src={src} alt="Offline payment QR code" width={size} height={size} />
      ) : (
        <span className="text-xs text-[#0A1128]">Generating QR…</span>
      )}
    </div>
  );
}
