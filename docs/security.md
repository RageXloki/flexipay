# PayFlow Security Architecture & Threat Model

## 1. Security Philosophy: Defense in Depth

In financial software, security is an architectural baseline rather than an afterthought. PayFlow is engineered under strict principle-of-least-privilege (PoLP) and zero-trust data storage rules.

---

## 2. Core Security Controls

### 2.1 Zero Raw Card / CVV Storage (PCI-DSS Compliance Principle)
- Raw Primary Account Numbers (PAN) and Card Verification Values (CVV) are processed strictly in ephemeral process memory to generate a cryptographic surrogate token (`tok_sand_...`).
- Only non-sensitive display elements (`card_brand`, `last_four_digits`, `expiry_month`, `expiry_year`, and `cardholder_name`) are persisted.
- Database schema physically lacks CVV and full PAN columns.

### 2.2 Idempotent API Execution
- Every payment and wallet top-up endpoint processes an `Idempotency-Key` header.
- Repeated requests using the same key return the original processed transaction payload, preventing accidental duplicate debits caused by network timeouts or repeated button clicks.

### 2.3 Authentication & Session Management
- **Passwords**: Hashed using Django's PBKDF2 algorithm with SHA-256 and thousands of salt rounds.
- **JWT Architecture**: Cryptographically signed access tokens (60-minute expiry) and rotating refresh tokens (7-day lifetime) using HMAC-SHA256 (`HS256`).
- **Two-Factor Authentication**: Optional simulated TOTP OTP step for high-security accounts.

### 2.4 Educational Fraud Risk Simulation
Rule-based risk evaluator assesses transaction traits before committing ledger state:
1. **High-Value Threshold**: Single transfers exceeding ₹50,000 are flagged for supervisor review.
2. **Velocity Limits**: Detects burst frequency (>= 4 requests in under 30 seconds).
3. **Repeated Failures**: Repeated failed payment attempts trigger temporary friction.

### 2.5 Audit Trails & Monitoring
- **`LoginActivity`**: Records timestamp, IP address, user-agent, and status for every session attempt.
- **`SecurityEvent`**: Tracks critical actions (password modifications, 2FA toggles, tokenized card additions).

---

## 3. Threat Model & Mitigation Matrix

| Threat | Attack Vector | PayFlow Mitigation |
|---|---|---|
| **SQL Injection** | Parameter tampering | Django ORM parameterized queries; raw SQL is avoided |
| **XSS (Cross-Site Scripting)** | Malicious payloads in descriptions | React automatic JSX escaping; Content-Type sniffing disabled |
| **Replay Attacks** | Resending valid payment packets | Unique `Idempotency-Key` header with database unique constraint |
| **Credential Stuffing** | Automated brute force | Password strength policy, rate limiting, and 2FA simulation |
| **Unauthorized Role Escalation** | Calling admin endpoints | DRF Permission classes (`IsAuthenticated`, role verification check) |
