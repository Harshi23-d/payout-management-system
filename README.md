# User Payout Management System

Low-Level Design and implementation of a payout management system for affiliate sales.

## Tech Stack
- Node.js + Express
- In-memory data store (for simplicity — swappable with any DB)

## Setup
\`\`\`
npm install
node app.js
\`\`\`
Server runs on `http://localhost:3000`

## Design Docs
See `docs/DESIGN.md` for full schema, relationships, and design decisions.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /sales | Create a new sale |
| GET | /sales | List all sales |
| POST | /advance-payout/run | Run advance payout job (10% of pending sales, idempotent) |
| POST | /sales/:id/reconcile | Reconcile a sale to approved/rejected |
| POST | /users/:id/withdraw | Withdraw balance (max once per 24hrs) |
| POST | /payouts/:id/fail | Mark payout cancelled/rejected/failed → credits balance back |
| GET | /users/:id/balance | Get current withdrawable balance |

## Business Rules Implemented
- Advance payout = 10% of earning for pending sales, paid only once per sale (idempotency enforced via unique AdvancePayoutTransaction per sale).
- Reconciliation: approved → earning − advance paid credited; rejected → advance paid deducted.
- Withdrawal restricted to once per 24 hours per user.
- Failed/cancelled/rejected payouts credit the amount back to withdrawable balance.

## Edge Cases Handled
- Advance payout job run multiple times → no duplicate payments (checked via existing transaction record).
- Reconciling an already-reconciled sale → throws error.
- Withdrawing more than available balance → throws error.
- Withdrawing before 24 hours have passed → throws error.
- Invalid reconciliation/failure status values → rejected with error.

## Testing
Run `node index.js` for a full in-process demo, or start the server and run `node test-api.js` to test via real HTTP calls.