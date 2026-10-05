# PayFlow | Modern Digital Payment Gateway & Wallet Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-092E20.svg?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **SANDBOX / DEMO ENVIRONMENT DISCLOSURE**  
> PayFlow is a simulated payment gateway and digital wallet web application engineered for software portfolio showcase, resume demonstrations, and academic evaluation. **It operates exclusively in a simulated sandbox environment.** It does NOT connect to real central banking networks or charge actual funds.

---

## 🌟 Executive Overview

**PayFlow** is a full-stack financial technology platform inspired by the user experiences of modern payment platforms like Google Pay, PhonePe, and Paytm, coupled with the merchant capabilities of Stripe and Razorpay.

Engineered with an original brand identity, modern glassmorphic aesthetics, and strict adherence to fintech security standards, PayFlow provides a complete suite of digital payment capabilities:

- **P2P Transfers**: Send & receive money with instant recipient resolution across email, phone, and virtual UPI handles.
- **Simulated UPI Switch**: Create personal UPI IDs (`alex@payflow`), generate dynamic BharatQR/UPI QR codes, and simulate instant camera scanning payments.
- **Tokenized Card Vault**: PCI-DSS compliant architecture. Cards are tokenized in memory; raw card numbers and CVVs are **never stored** in the database.
- **Double-Entry Ledger**: Atomic database transactions (`select_for_update()`) ensuring mathematical integrity for all wallet credits, debits, and withdrawals.
- **Idempotent API Design**: Mutation requests enforce the `Idempotency-Key` header, guaranteeing zero double-debit charges on network retries or double-clicks.
- **Merchant Hub & Hosted Links**: Create payment links (`/pay/:linkCode`) for e-commerce or invoices, accept payments from guests, view real-time sales metrics, and issue sandbox refunds.
- **Educational Fraud Detection Simulation**: Evaluates transactions for velocity bursts, high-value limits (>₹50,000), and consecutive failure patterns with transparent demo alerts.
- **Security Center**: Calculates real-time Security Scores (e.g. 85/100), tracks active device sessions, provides login audit logs, and supports 2FA simulation.
- **Role-Based Access Control (RBAC)**: Distinct workflows for Regular Users (`USER`), Merchants (`MERCHANT`), and Platform Supervisors (`ADMIN`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.13, Django 5.2, Django REST Framework, SimpleJWT (HS256), `django-cors-headers`, `django-filter`, Pillow, QRCode |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti, HTML5 QR Scanner |
| **Database** | SQLite (Plug-and-play local development), PostgreSQL 16 ready via Docker Compose |
| **DevOps & Containers** | Docker, Docker Compose, Git, Environment variables (`.env`) |

---

## 🔑 Demo Personas & Pre-Seeded Credentials

PayFlow includes one-click persona switching directly in the navigation banner:

| Persona | Email / Phone | Password | Starting Wallet | Special Permissions |
|---|---|---|---|---|
| **Demo User** (Alex Morgan) | `user@payflow.local`<br>`+919876543210` | `DemoUser@123` | ₹24,500.00 | P2P transfer, QR scan, saved cards, UPI IDs |
| **Demo Merchant** (Apex Tech Gear) | `merchant@payflow.local`<br>`+919876543211` | `DemoMerchant@123`<br>*(OTP: `123456`)* | ₹1,42,800.00 | Merchant Hub, payment links, refund issuance |
| **Demo Admin** (Supervisor) | `admin@payflow.local`<br>`+919876543212` | `DemoAdmin@123` | ₹500,000.00 | Platform analytics, fraud review, user suspension |

---

## 💳 Sandbox Card Numbers (Test Mode)

| Card Brand | Test Card Number | Expiry | CVV | Behavior |
|---|---|---|---|---|
| **Visa** | `4111 1111 1111 4242` | Any future date | Any 3 digits | ✅ Authorized & Tokenized |
| **Mastercard** | `5555 5555 5555 5555` | Any future date | Any 3 digits | ✅ Authorized & Tokenized |
| **RuPay** | `6080 1234 5678 9012` | Any future date | Any 3 digits | ✅ Authorized & Tokenized |
| **Decline Test** | Any card ending in `0000` | Any future date | Any 3 digits | ❌ Card Declined Simulation |

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/your-username/payflow.git
cd payflow

# Create and activate Python virtual environment
python -m venv backend_venv
# On Windows:
.\backend_venv\Scripts\activate
# On Linux/macOS:
source backend_venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run migrations and seed sandbox data
cd backend
python manage.py migrate
python manage.py seed_demo_data

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 2. Set Up Frontend

```bash
# In a separate terminal, navigate to frontend/
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

## 🐳 Docker Compose Deployment

To run the entire platform with PostgreSQL and Redis in containers:

```bash
# From repository root:
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Running Automated Tests

PayFlow includes a comprehensive unit and API integration test suite covering authentication, tokenization safety, atomic transfers, idempotency, and fraud detection rules:

```bash
# Run backend tests
cd backend
python manage.py test
```

Expected output:
```
Ran 5 tests in 6.872s
OK
```

---

## 🔒 Security Architecture Highlights

1. **Zero Raw Card / CVV Storage (PCI-DSS Compliance Principle)**:
   Raw card PAN and CVV parameters are evaluated strictly in process memory to generate a secure surrogate token (`tok_sand_...`). The database schema physically lacks columns for raw card numbers and CVV codes. Only the card brand, masked format (`•••• 4242`), and expiration are saved.
2. **Idempotency Protection**:
   All financial mutation endpoints accept an `Idempotency-Key` HTTP header. Duplicate requests return the original transaction record without re-debiting balances.
3. **Double-Entry Ledger Atomicity**:
   Ledger balances are debited and credited inside atomic database transactions using row-level locking (`select_for_update()`) to prevent race conditions.
4. **Educational Fraud Detection Engine**:
   Evaluates transactions in real time for:
   - High-value anomaly limits (>₹50,000)
   - Velocity bursts (>=4 transactions in under 30 seconds)
   - Consecutive failure rate spikes
5. **Pluggable Payment Gateway Architecture**:
   Gateways implement the `payments.providers.PaymentProvider` interface, allowing plug-and-play migration between the sandbox simulator and real gateways like Razorpay or Stripe without changing business logic.

---

## 📚 Technical Documentation

Detailed architectural and design specifications are available in the [`docs/`](docs/) directory:
- [System Architecture](docs/architecture.md)
- [REST API Reference](docs/api.md)
- [Database Schema & Models](docs/database.md)
- [Security & Threat Model](docs/security.md)
- [Payment Flow & Sequence Diagrams](docs/payment-flow.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
