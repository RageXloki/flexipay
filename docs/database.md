# PayFlow Database Schema & Modeling

## 1. Relational Entity Overview

PayFlow implements normalized database models designed for referential integrity, financial auditability, and data segregation.

```
┌──────────────────┐       1:1       ┌──────────────────┐
│   accounts.User  │─────────────────│ accounts.Profile │
└────────┬─────────┘                 └──────────────────┘
         │
         ├── 1:1 ──── ┌──────────────────┐
         │            │  wallets.Wallet  │
         │            └────────┬─────────┘
         │                     │ 1:N
         │                     ▼
         │            ┌──────────────────────────┐
         │            │ wallets.WalletTransaction│
         │            └──────────────────────────┘
         │
         ├── 1:N ──── ┌──────────────────────────┐
         │            │   payments.CardToken     │ (Tokenized Only)
         │            └──────────────────────────┘
         │
         ├── 1:N ──── ┌──────────────────────────┐
         │            │   payments.UPIAccount    │
         │            └──────────────────────────┘
         │
         ├── 1:N ──── ┌──────────────────────────┐
         │            │   payments.BankAccount   │
         │            └──────────────────────────┘
         │
         ├── 1:N ──── ┌──────────────────────────┐
         │            │   payments.Transaction   │
         │            └────────┬─────────────────┘
         │                     │ 1:N
         │                     ▼
         │            ┌──────────────────────────┐
         │            │    merchants.Refund      │
         │            └──────────────────────────┘
         │
         └── 1:1 ──── ┌──────────────────────────┐
                      │    merchants.Merchant    │
                      └────────┬─────────────────┘
                               │ 1:N
                               ▼
                      ┌──────────────────────────┐
                      │  merchants.PaymentLink   │
                      └──────────────────────────┘
```

---

## 2. Table Schemas & Constraints

### 2.1 `accounts_user`
- `id` (UUID, Primary Key)
- `email` (VARCHAR 255, Unique, Index)
- `phone_number` (VARCHAR 20, Unique, Index)
- `full_name` (VARCHAR 150)
- `password` (VARCHAR 128, PBKDF2 with SHA256)
- `role` (VARCHAR 20: `USER`, `MERCHANT`, `ADMIN`)
- `is_verified` (BOOLEAN)
- `two_factor_enabled` (BOOLEAN)
- `date_joined` (DATETIME)

### 2.2 `wallets_wallet`
- `id` (UUID, Primary Key)
- `user_id` (UUID, ForeignKey -> `accounts_user`, Unique)
- `balance` (DECIMAL 14, 2, MinValueValidator=0.00)
- `currency` (VARCHAR 10, Default: 'INR')
- `status` (VARCHAR 20: `ACTIVE`, `FROZEN`, `RESTRICTED`)

### 2.3 `wallets_wallettransaction`
- `id` (UUID, Primary Key)
- `wallet_id` (UUID, ForeignKey -> `wallets_wallet`)
- `transaction_type` (VARCHAR 10: `CREDIT`, `DEBIT`)
- `amount` (DECIMAL 14, 2)
- `balance_before` (DECIMAL 14, 2)
- `balance_after` (DECIMAL 14, 2)
- `reference_type` (VARCHAR 30: `DEPOSIT`, `WITHDRAWAL`, `TRANSFER_SEND`, `TRANSFER_RECEIVE`, `REFUND`, `MERCHANT_PAYMENT`)
- `reference_id` (VARCHAR 100)
- `created_at` (DATETIME, Index)

### 2.4 `payments_cardtoken`
- `id` (UUID, Primary Key)
- `user_id` (UUID, ForeignKey -> `accounts_user`)
- `card_token` (VARCHAR 128, Unique, Index)
- `cardholder_name` (VARCHAR 150)
- `card_brand` (VARCHAR 20: `VISA`, `MASTERCARD`, `RUPAY`, `AMEX`)
- `last_four_digits` (VARCHAR 4)
- `expiry_month` (INTEGER)
- `expiry_year` (INTEGER)
- `is_default` (BOOLEAN)
- *(Note: Raw card numbers and CVV columns do NOT exist)*

### 2.5 `payments_transaction`
- `id` (UUID, Primary Key)
- `transaction_id` (VARCHAR 50, Unique, Index, Human-readable format: `TXN-2026-XXXXXXXX`)
- `sender_id` (UUID, ForeignKey -> `accounts_user`, Nullable)
- `receiver_id` (UUID, ForeignKey -> `accounts_user`, Nullable)
- `amount` (DECIMAL 14, 2)
- `currency` (VARCHAR 10)
- `payment_method` (VARCHAR 30: `WALLET`, `UPI`, `CARD`, `NET_BANKING`)
- `description` (VARCHAR 255)
- `status` (VARCHAR 20: `PENDING`, `PROCESSING`, `SUCCESSFUL`, `FAILED`, `CANCELLED`, `REFUNDED`, Index)
- `idempotency_key` (VARCHAR 128, Unique, Nullable, Index)
- `is_flagged_fraud` (BOOLEAN, Default: False)
- `fraud_reason` (VARCHAR 255)
- `created_at` (DATETIME, Index)
- `completed_at` (DATETIME, Nullable)
