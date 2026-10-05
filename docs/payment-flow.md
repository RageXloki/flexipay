# PayFlow Payment Flow & Sequence Diagrams

## 1. End-to-End Payment Flow Diagram

```
User
 │
 ▼
Frontend (React 19 / TypeScript)
 │  - Validates form inputs & amount
 │  - Prompts for Security PIN modal
 │  - Generates unique Idempotency-Key
 │
 ▼
Django REST Framework API
 │
 ▼
Authentication & Permissions Layer
 │  - Validates Bearer JWT Access Token
 │  - Resolves Sender Account Context
 │
 ▼
Payment Service & Fraud Engine
 │  - Evaluates Fraud Rules (High amount / Rapid velocity)
 │  - Resolves Recipient (Email / Phone / UPI ID)
 │  - Verifies Wallet Balance / Token Validity
 │
 ▼
Payment Provider Abstraction Layer
 │  - Calls MockPaymentProvider.create_payment()
 │  - Calls MockPaymentProvider.authorize_payment()
 │  - (Or future Razorpay / Stripe adapter)
 │
 ▼
Atomic Ledger Committer (DB Transaction)
 │  - select_for_update() on sender & receiver wallets
 │  - Debits sender wallet
 │  - Credits receiver wallet
 │  - Inserts Transaction record (TXN-2026-XXXXXXXX)
 │
 ▼
In-App Notification Dispatcher
 │  - Notifies Sender: "Money Sent"
 │  - Notifies Receiver: "Money Received"
 │
 ▼
Receipt Generation Engine
    - Generates immutable digital receipt
    - Encodes verification QR payload
    - Client renders printable receipt & confetti celebration
```

---

## 2. P2P Send Money Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User (Alice)
    participant UI as PayFlow Frontend
    participant API as Django REST API
    participant Fraud as Fraud Engine
    participant Wallet as Wallet Service
    participant DB as Database Ledger
    participant Notif as Notification Service

    Customer->>UI: Select Recipient (bob@payflow), Enter ₹500
    UI->>Customer: Prompt for 4-Digit Security PIN
    Customer->>UI: Enters PIN
    UI->>API: POST /api/payments/send/ (Idempotency-Key)
    API->>Fraud: Evaluate Risk Rules (Limits, Burst Velocity)
    Fraud-->>API: Status: Risk OK
    API->>Wallet: Check Alice's Wallet Balance >= ₹500
    Wallet-->>API: Balance Verified
    
    critical Atomic DB Transaction
        API->>DB: Debit Alice's Wallet ₹500
        API->>DB: Credit Bob's Wallet ₹500
        API->>DB: Insert Transaction TXN-2026-XXXX (SUCCESSFUL)
    end

    API->>Notif: Dispatch Alert to Alice & Bob
    API-->>UI: 200 OK + Transaction Details
    UI->>Customer: Display Success Screen & Digital Printable Receipt
```

---

## 3. Merchant Payment Link Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Guest Customer
    participant Checkout as Hosted Checkout (/pay/:linkCode)
    participant API as Django REST API
    participant Provider as Payment Provider Layer
    participant Merchant as Merchant Wallet

    Buyer->>Checkout: Open Checkout Link & Select Payment Method (Card)
    Buyer->>Checkout: Enter Name, Email & Click "Authorize & Pay"
    Checkout->>API: POST /api/merchants/pay-link/:code/process/
    API->>Provider: create_payment() & authorize_payment()
    Provider-->>API: Authorization Approved (Mock Gateway)
    
    critical Atomic DB Transaction
        API->>Merchant: Credit Merchant Wallet ₹Amount
        API->>API: Record Transaction linked to Merchant
    end

    API-->>Checkout: 200 OK + Receipt Payload
    Checkout->>Buyer: Render Confetti & Payment Receipt
```
