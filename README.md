# Kauri Cash Flow

Build Kauri Pay, a polished hackathon-ready offline-first digital payment prototype web application designed for secure small-value transactions without internet connectivity.

Key requirements:
1. Design & Theme:
- Premium fintech aesthetic: Dark navy/deep blue (#0A1128 / #0F172A), electric blue accents (#3B82F6 / #00D2FF), crisp cards, sleek typography, subtle animations, responsive.

2. Global Connection Simulator & Top Bar:
- Persistent toggle: ONLINE / OFFLINE / SYNCING status with badge indicator (🟢 Online, 🟠 Offline Mode, 🔵 Syncing).
- Demo Device Switcher top control: seamlessly switch between '📱 User Device' (Rahul, offline balance ₹2,500) and '🏪 Merchant Device' (Sharma Store, balance ₹8,450). Both share a unified LocalStorage state for instant multi-role demoing on a single screen.

3. User Flow:
- Welcome/role picker (Continue as User vs Merchant) + quick profile switch.
- User Dashboard: Available offline balance, quick actions (Pay, My QR, Scan, Transactions, Security), connection state badge, recent transactions.
- Send Payment screen: Merchant selector, amount, optional note, balance check. Clicking 'Create Offline Payment' generates a unique Transaction ID, Nonce, Timestamp, and Simulated Ed25519 Signature.
- Generated Payment QR with structured JSON payload, plus a 'Copy Demo Payload' button for seamless one-click testing without a camera.

4. Merchant Flow:
- Merchant Dashboard: Merchant balance, offline payments ledger breakdown (Pending verification, Verified offline, Pending sync, Synced).
- Scan Payment screen: Live camera QR scanner + manual/quick-paste demo transaction payload fallback.
- Local Verification Checklist displaying green checkmarks: Signature valid, Nonce unique, Timestamp fresh, Balance/limit checks.
- 'Accept Payment' button updates merchant balance, logs to local ledger as 'Pending Sync'.

5. Local Transaction Ledger:
- Persisted in LocalStorage with filters (All, Verified Offline, Pending Sync, Synced). Detailed transaction modal showing cryptographic details (Ed25519 signature, Nonce, TXN ID).

6. Synchronization Flow:
- Switching from OFFLINE to ONLINE prompts a 'Connection Restored' banner / modal.
- 'Sync Transactions' triggers an animated 5-step reconciliation process: Reading local ledger -> Verifying cryptographic signatures -> Checking nonces & replay -> Reconciling with central ledger -> Settlement complete. Statuses transition from Pending Sync -> Synced.

7. Interactive Hackathon Demo Mode:
- Guided 10-step visual progress timeline walkthrough (User Offline -> Payment Created & Signed -> QR Generated -> Merchant Scans -> Verified Offline -> Local Ledger Updated -> Connectivity Restored -> Sync & Settlement) that judges can step through with one click.

8. Security Center:
- Cards breaking down Ed25519 signing, Nonce uniqueness, Timestamp windows, local ledger persistence, and secure sync reconciliation, with clear disclaimer on prototype offline double-spending mitigations.

9. Error Handling:
- Realistic validations for insufficient offline balance, duplicate nonces, and invalid payloads.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ab9525b4-a5b6-4e95-ae1a-64dcf22c115b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
