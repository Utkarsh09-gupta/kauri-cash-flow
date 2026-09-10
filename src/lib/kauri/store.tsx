import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { canonicalize, newNonce, newTxnId, signPayload, DEVICE_PUBLIC_KEY } from "./crypto";
import { USER, OFFLINE_TXN_LIMIT, type Connection, type Device, type KauriState, type Txn, type TxnStatus } from "./types";
import { playSuccessSound, playSyncSound } from "./audio";

const KEY = "kauri-pay-state-v1";

const initialState: KauriState = {
  device: "user",
  connection: "offline",
  userBalance: 2500,
  merchantBalance: 8450,
  txns: [],
  usedNonces: [],
  roleChosen: false,
  soundEnabled: true,
  maxOfflineCumulativeLimit: OFFLINE_TXN_LIMIT,
};

type Ctx = {
  state: KauriState;
  ready: boolean;
  cumulativeOfflineSpent: number;
  remainingOfflineLimit: number;
  setDevice: (d: Device) => void;
  setConnection: (c: Connection) => void;
  chooseRole: (d: Device) => void;
  toggleSound: () => void;
  createPayment: (input: { amount: number; note?: string; merchantId: string; merchantName: string }) => Txn;
  acceptPayment: (txn: Txn) => void;
  markSynced: () => void;
  exportStateJSON: () => void;
  importStateJSON: (jsonString: string) => boolean;
  reset: () => void;
};

const KauriContext = createContext<Ctx | null>(null);

export function KauriProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KauriState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as KauriState) });
    } catch {
      /* ignore corrupt state */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const setDevice = useCallback((device: Device) => setState((s) => ({ ...s, device })), []);
  const setConnection = useCallback((connection: Connection) => setState((s) => ({ ...s, connection })), []);
  const chooseRole = useCallback(
    (device: Device) => setState((s) => ({ ...s, device, roleChosen: true })),
    [],
  );
  const toggleSound = useCallback(() => setState((s) => ({ ...s, soundEnabled: !s.soundEnabled })), []);

  const cumulativeOfflineSpent = useMemo(() => {
    return state.txns
      .filter((t) => t.status !== "synced")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.txns]);

  const remainingOfflineLimit = useMemo(() => {
    return Math.max(0, state.maxOfflineCumulativeLimit - cumulativeOfflineSpent);
  }, [state.maxOfflineCumulativeLimit, cumulativeOfflineSpent]);

  const createPayment: Ctx["createPayment"] = useCallback(
    (input) => {
      const base = {
        txnId: newTxnId(),
        amount: input.amount,
        note: input.note,
        payer: USER.name,
        payerVpa: USER.vpa,
        merchant: input.merchantName,
        merchantId: input.merchantId,
        nonce: newNonce(),
        timestamp: Date.now(),
      };
      const txn: Txn = {
        ...base,
        signature: signPayload(canonicalize(base as never)),
        publicKey: DEVICE_PUBLIC_KEY,
        status: "pending_verification",
      };

      setState((s) => {
        if (s.soundEnabled) playSuccessSound(true);
        return {
          ...s,
          userBalance: Math.round((s.userBalance - input.amount) * 100) / 100,
          txns: [txn, ...s.txns],
        };
      });
      return txn;
    },
    [],
  );

  const acceptPayment: Ctx["acceptPayment"] = useCallback(
    (txn) => {
      setState((s) => {
        if (s.soundEnabled) playSuccessSound(true);
        const exists = s.txns.some((t) => t.txnId === txn.txnId);
        const accepted: Txn = { ...txn, status: "pending_sync", acceptedAt: Date.now() };
        return {
          ...s,
          merchantBalance: Math.round((s.merchantBalance + txn.amount) * 100) / 100,
          usedNonces: [...s.usedNonces, txn.nonce],
          txns: exists ? s.txns.map((t) => (t.txnId === txn.txnId ? accepted : t)) : [accepted, ...s.txns],
        };
      });
    },
    [],
  );

  const markSynced = useCallback(() => {
    setState((s) => {
      if (s.soundEnabled) playSyncSound(true);
      return {
        ...s,
        connection: "online",
        txns: s.txns.map((t) =>
          t.status === "pending_sync" ? { ...t, status: "synced" as TxnStatus, syncedAt: Date.now() } : t,
        ),
      };
    });
  }, []);

  const exportStateJSON = useCallback(() => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KauriStateBackup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importStateJSON = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString) as KauriState;
      if (parsed && Array.isArray(parsed.txns)) {
        setState({ ...initialState, ...parsed });
        return true;
      }
    } catch {
      /* corrupt JSON */
    }
    return false;
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(initialState);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      cumulativeOfflineSpent,
      remainingOfflineLimit,
      setDevice,
      setConnection,
      chooseRole,
      toggleSound,
      createPayment,
      acceptPayment,
      markSynced,
      exportStateJSON,
      importStateJSON,
      reset,
    }),
    [
      state,
      ready,
      cumulativeOfflineSpent,
      remainingOfflineLimit,
      setDevice,
      setConnection,
      chooseRole,
      toggleSound,
      createPayment,
      acceptPayment,
      markSynced,
      exportStateJSON,
      importStateJSON,
      reset,
    ],
  );

  return <KauriContext.Provider value={value}>{children}</KauriContext.Provider>;
}

export function useKauri() {
  const ctx = useContext(KauriContext);
  if (!ctx) throw new Error("useKauri must be used inside KauriProvider");
  return ctx;
}

export function useLedgerCounts() {
  const { state } = useKauri();
  return useMemo(() => {
    const count = (s: TxnStatus) => state.txns.filter((t) => t.status === s).length;
    return {
      pending_verification: count("pending_verification"),
      verified_offline: count("verified_offline"),
      pending_sync: count("pending_sync"),
      synced: count("synced"),
    };
  }, [state.txns]);
}
