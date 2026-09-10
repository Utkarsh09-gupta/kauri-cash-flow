export type Connection = "online" | "offline" | "syncing";
export type Device = "user" | "merchant";

export type TxnStatus = "pending_verification" | "verified_offline" | "pending_sync" | "synced";

export type Txn = {
  txnId: string;
  amount: number;
  note?: string;
  payer: string;
  payerVpa: string;
  merchant: string;
  merchantId: string;
  nonce: string;
  timestamp: number;
  signature: string;
  publicKey: string;
  status: TxnStatus;
  acceptedAt?: number;
  syncedAt?: number;
};

export type KauriState = {
  device: Device;
  connection: Connection;
  userBalance: number;
  merchantBalance: number;
  txns: Txn[];
  usedNonces: string[];
  roleChosen: boolean;
};

export type Payload = {
  v: 1;
  txnId: string;
  amount: number;
  note?: string;
  payer: string;
  payerVpa: string;
  merchant: string;
  merchantId: string;
  nonce: string;
  timestamp: number;
  signature: string;
  publicKey: string;
  alg: "Ed25519";
};

export const MERCHANTS = [
  { id: "MERCH-SHARMA-001", name: "Sharma Store" },
  { id: "MERCH-CHAI-014", name: "Anand Chai Corner" },
  { id: "MERCH-METRO-207", name: "Metro Ticket Counter" },
  { id: "MERCH-KIRANA-093", name: "Gupta Kirana" },
];

export const USER = { name: "Rahul Verma", vpa: "rahul@kauri" };
export const OFFLINE_TXN_LIMIT = 2000;
export const TIMESTAMP_WINDOW_MS = 1000 * 60 * 60 * 24;

export const STATUS_LABEL: Record<TxnStatus, string> = {
  pending_verification: "Pending verification",
  verified_offline: "Verified offline",
  pending_sync: "Pending sync",
  synced: "Synced",
};
