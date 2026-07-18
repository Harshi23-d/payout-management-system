# Database Schema — User Payout Management System

## 1. User
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| name | String | User's name |
| withdrawableBalance | Decimal | Current balance available to withdraw |
| lastWithdrawalAt | DateTime (nullable) | Timestamp of last withdrawal, used to enforce 24hr rule |

## 2. Brand
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| name | String | e.g. brand_1, brand_2 |

## 3. Sale
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| userId | FK → User.id | Owner of the sale |
| brandId | FK → Brand.id | Associated brand |
| earning | Decimal | Earning amount for this sale |
| status | Enum | pending / approved / rejected |
| advancePaid | Decimal (default 0) | Amount already paid as advance |
| advancePaidAt | DateTime (nullable) | When advance was paid |
| reconciledAt | DateTime (nullable) | When admin reconciled this sale |

## 4. AdvancePayoutTransaction
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| saleId | FK → Sale.id (unique) | One sale can have only ONE advance transaction — this enforces "never pay advance twice" |
| amount | Decimal | 10% of sale earning |
| createdAt | DateTime | Timestamp |

## 5. Payout (Withdrawal)
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| userId | FK → User.id | Who requested withdrawal |
| amount | Decimal | Amount withdrawn |
| status | Enum | initiated / completed / cancelled / rejected / failed |
| createdAt | DateTime | Timestamp |

## 6. BalanceTransaction (Ledger)
| Field | Type | Description |
|---|---|---|
| id | String/UUID | Primary key |
| userId | FK → User.id | Affected user |
| type | Enum | advance / final_adjustment / withdrawal / payout_reversal |
| amount | Decimal | Positive = credit, Negative = debit |
| referenceId | String | ID of related Sale or Payout |
| createdAt | DateTime | Timestamp |

---

## Relationships
- User (1) → (many) Sale
- Brand (1) → (many) Sale
- Sale (1) → (1) AdvancePayoutTransaction — nullable, unique constraint on saleId
- User (1) → (many) Payout
- User (1) → (many) BalanceTransaction

---

## Why this design
- **AdvancePayoutTransaction** with a unique `saleId` prevents double advance payouts even if the job runs multiple times — you check "does a row exist for this saleId?" instead of trusting a boolean flag that could be missed in race conditions.
- **BalanceTransaction** acts as an audit ledger — every credit/debit to a user's balance is logged with a reason and reference, making it easy to reconstruct "why is this user's balance what it is" and to handle the failed-payout-recovery requirement cleanly (just insert a `payout_reversal` row and update balance).
- **Payout.status** covers the failed-payout-recovery case (Question 2) directly — cancelled/rejected/failed all trigger the same recovery logic.