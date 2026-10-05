# PayFlow REST API Reference

Base URL: `http://localhost:8000/api`

All mutating financial requests should include:
- `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- `Content-Type: application/json`
- `Idempotency-Key: <UUID>`

---

## 1. Authentication & Security Endpoints (`/api/auth/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register/` | Register new account (`full_name`, `email`, `phone_number`, `password`, `role`) |
| `POST` | `/auth/login/` | Sign in with email or phone + password (supports 2FA `otp`) |
| `POST` | `/auth/logout/` | Invalidate active refresh token |
| `POST` | `/auth/token/refresh/` | Obtain fresh access token using refresh token |
| `GET` | `/auth/me/` | Fetch authenticated user data, profile, and security score |
| `PATCH`| `/auth/profile/` | Update user details (name, city, bio) |
| `POST` | `/auth/change-password/`| Change account password (requires old password) |
| `POST` | `/auth/toggle-2fa/` | Enable or disable two-factor authentication |
| `GET` | `/auth/security/` | Fetch security center metrics, login history, and audit log |
| `GET` | `/auth/users/search/?q=`| Autocomplete recipient lookup by email, phone, or UPI handle |

---

## 2. Wallet & Ledger Endpoints (`/api/wallet/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/wallet/` | Retrieve wallet balance, currency, and account status |
| `GET` | `/wallet/transactions/` | Retrieve double-entry ledger credit/debit audit history |
| `POST` | `/wallet/add-money/` | Top up wallet via simulated Card, UPI, or Net Banking |
| `POST` | `/wallet/withdraw/` | Withdraw funds from wallet to verified bank account |

---

## 3. Payments & Transacting (`/api/payments/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payments/send/` | Send money to user via email, phone, or UPI handle |
| `GET` | `/payments/transactions/` | Paginated transaction explorer with filters (`status`, `method`, `direction`, `search`) |
| `GET` | `/payments/transactions/<id>/` | Detailed digital receipt payload |
| `GET` | `/payments/cards/` | List saved tokenized cards (masked format: `•••• 4242`) |
| `POST` | `/payments/cards/` | Tokenize and save card in sandbox vault (zero CVV storage) |
| `DELETE`| `/payments/cards/<id>/`| Remove tokenized card |
| `GET` | `/payments/upi/` | List user UPI IDs and primary dynamic QR payload |
| `POST` | `/payments/upi/` | Register additional custom UPI handle (`handle@payflow`) |
| `GET` | `/payments/banks/` | List linked bank accounts |
| `POST` | `/payments/banks/` | Link new simulated bank account |
| `GET` | `/payments/requests/` | List incoming pending and outgoing payment requests |
| `POST` | `/payments/requests/` | Initiate payment request |
| `POST` | `/payments/requests/<id>/respond/` | Accept or reject payment request |
| `POST` | `/payments/qr/verify/` | Verify & parse scanned UPI string or PayFlow merchant barcode |

---

## 4. Merchant Engine (`/api/merchants/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/merchants/profile/` | Fetch merchant business details |
| `GET` | `/merchants/dashboard/` | Revenue KPIs, 7-day trend chart, and recent orders |
| `GET` | `/merchants/payment-links/` | List merchant payment links |
| `POST` | `/merchants/payment-links/` | Generate new shareable payment link |
| `GET` | `/merchants/pay-link/<code>/`| Public endpoint to retrieve checkout metadata |
| `POST` | `/merchants/pay-link/<code>/process/`| Public checkout payment processing |
| `POST` | `/merchants/refunds/` | Issue full or partial sandbox refund |

---

## 5. Notifications & Administration (`/api/notifications/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications/` | List notifications and unread count |
| `POST` | `/notifications/mark-read/`| Mark all notifications as read |
| `GET` | `/notifications/admin/overview/` | Platform metrics and fraud flags (Admin only) |
| `PATCH`| `/notifications/admin/users/action/`| Suspend or activate user account (Admin only) |
