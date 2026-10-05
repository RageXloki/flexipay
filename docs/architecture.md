# PayFlow Architecture & System Design

## 1. High-Level Architectural Overview

PayFlow is designed using a decoupled, service-oriented multi-tier architecture adhering to modern fintech and banking interface specifications. The platform separates client-side state presentation, idempotent API transport, atomic ledger transactions, and payment provider execution.

```
                    ┌──────────────────────────────┐
                    │      Client Applications     │
                    │   React 19 + TypeScript +    │
                    │      Tailwind CSS UI         │
                    └──────────────┬───────────────┘
                                   │ HTTPS / REST (JWT)
                                   │ Idempotency-Key
                                   ▼
                    ┌──────────────────────────────┐
                    │    API Gateway & Security    │
                    │  CORS, DRF Auth, Rate Limit  │
                    └──────────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Accounts & RBAC │      │  Payment Switch  │      │  Merchant Engine │
│  User, Profile,  │      │  Send, Request,  │      │  Links, Checkout │
│  2FA & Security  │      │  UPI & QR Router │      │  Sandbox Refunds │
└──────────────────┘      └────────┬─────────┘      └──────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
      ┌───────────────────────┐           ┌─────────────────────┐
      │ Payment Provider      │           │ Educational Fraud   │
      │ Abstraction Layer     │           │ Detection Engine    │
      │ ┌───────────────────┐ │           │ (Velocity & Limits) │
      │ │MockPaymentProvider│ │           └─────────────────────┘
      │ ├───────────────────┤ │
      │ │Razorpay / Stripe  │ │
      │ └───────────────────┘ │
      └──────────┬────────────┘
                 │
                 ▼
      ┌───────────────────────┐
      │ Double-Entry Ledger   │
      │ Atomic DB Transaction │
      │ SQLite / PostgreSQL   │
      └───────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Pluggable Payment Provider Pattern
Payment gateways operate behind an abstract base class (`payments.providers.PaymentProvider`) declaring uniform interfaces:
- `create_payment(amount, currency, customer_id, metadata, idempotency_key)`
- `authorize_payment(payment_id, payment_method, payment_details)`
- `capture_payment(payment_id, amount)`
- `refund_payment(payment_id, amount, reason)`
- `verify_payment(payment_id)`

This decoupled strategy isolates core business workflows from vendor SDKs, allowing zero-friction toggling between Sandbox mode and production gateways (e.g., Stripe, Razorpay).

### 2.2 Idempotency Guarantees
Every mutating financial operation (`/api/payments/send/`, `/api/wallet/add-money/`) accepts an optional or required `Idempotency-Key` HTTP header. 
1. The server checks for existing transactions tagged with that key before starting ledger operations.
2. If matched, the system returns the original recorded payload without duplicate wallet balance deductions.

### 2.3 Double-Entry Ledger & Atomicity
Money movement follows strict double-entry ledger bookkeeping. Every credit to a destination wallet corresponds to an atomic debit from the source wallet or external bank order, enclosed inside `django.db.transaction.atomic()` with `select_for_update()` database row locking.
