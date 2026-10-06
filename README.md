# FlexiPay | Modern Digital Payment Gateway & Wallet Platform

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-092E20.svg?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **SANDBOX / DEMO ENVIRONMENT DISCLOSURE**  
> FlexiPay is a simulated payment gateway and digital wallet web application engineered for software portfolio showcase, resume demonstrations, and academic evaluation. **It operates exclusively in a simulated sandbox environment.** It does NOT connect to real central banking networks or charge actual funds.

---

## 🌟 Executive Overview

**FlexiPay** is a production-grade, full-stack financial technology web platform inspired by the core user experiences of modern consumer payment platforms (Google Pay, PhonePe, Paytm) coupled with the merchant capabilities of Stripe and Razorpay.

Engineered with an original brand identity, modern glassmorphic aesthetics, dual light/dark theme modes, WCAG accessibility, and strict adherence to fintech security standards, FlexiPay provides a complete suite of digital payment capabilities:

- **P2P Transfers**: Send & receive money with instant recipient resolution across email, phone, and virtual UPI handles.
- **Simulated UPI Switch**: Create personal UPI IDs (`alex@flexipay`), generate dynamic BharatQR/UPI QR codes, and simulate instant camera scanning payments.
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
| **Backend** | Python 3.12+, Django 5.2, Django REST Framework, SimpleJWT (HS256), Gunicorn, WhiteNoise, `django-cors-headers`, `django-filter`, Pillow, QRCode |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti, HTML5 QR Scanner |
| **Database** | SQLite (Plug-and-play local development), PostgreSQL 16 ready via Docker Compose |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend), Docker & Docker Compose |

---

## 🚀 1-Click Free Public Deployment

Deploying FlexiPay so it can be publicly accessed on the web for your portfolio or LinkedIn takes only a few minutes using **Vercel** (Frontend) and **Render** (Backend):

### Step 1: Deploy Backend to Render (Free)
1. Push this repository to your **GitHub** account.
2. Sign in to [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect [`backend/render.yaml`](backend/render.yaml), or enter the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - **Start Command**: `python manage.py migrate && python manage.py seed_demo_data && gunicorn payflow_core.wsgi:application --bind 0.0.0.0:$PORT`
5. Click **Create Web Service**. Your backend will be live at `https://flexipay-backend.onrender.com`!

### Step 2: Deploy Frontend to Vercel (Free)
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `VITE_API_URL` = `https://your-backend-name.onrender.com/api` (URL from Step 1)
4. Click **Deploy**. Vercel will deploy your frontend with full client-side routing support (`vercel.json`) at `https://flexipay.vercel.app`!

---

## 🔑 Demo Personas & Pre-Seeded Credentials

FlexiPay includes one-click persona switching directly in the navigation banner:

| Persona | Email / Identifier | Password | 2FA Code (if prompted) | Starting Wallet | Special Permissions |
|---|---|---|---|---|---|
| **Demo User** (Alex Morgan) | `user@flexipay.local`<br>`+919876543210` | `DemoUser@123` | *None* | ₹24,500.00 | P2P transfer, QR scan, saved cards, UPI IDs |
| **Demo Merchant** (Apex Tech Gear) | `merchant@flexipay.local`<br>`+919876543211` | `DemoMerchant@123` | `123456` | ₹1,42,800.00 | Merchant Hub, payment links, refund issuance |
| **Demo Admin** (Supervisor) | `admin@flexipay.local`<br>`+919876543212` | `DemoAdmin@123` | *None* | ₹500,000.00 | Platform analytics, fraud review, user suspension |

*(Note: Legacy `user@payflow.local` alias is also supported).*

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

### 1. Set Up Backend

```bash
# Activate virtual environment
.\backend_venv\Scripts\activate   # Windows
# source backend_venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Migrate and seed demo accounts
cd backend
python manage.py migrate
python manage.py seed_demo_data

# Start server
python manage.py runserver 127.0.0.1:8000
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser!

---

## 🧪 Running Automated Tests

```bash
cd backend
python manage.py test
```

Expected output:
```
Ran 5 tests in 6.284s
OK
```

---

## 📱 Ready-to-Post LinkedIn Template

Copy and paste this template directly to LinkedIn to showcase your project:

```markdown
🚀 Excited to share my latest full-stack project: FlexiPay — a Production-Style Digital Payment Gateway & Wallet Platform! 💳✨

Inspired by modern fintech architectures (Google Pay, PhonePe, and Stripe), I built FlexiPay to demonstrate core fintech engineering principles from scratch:

🔹 Simulated UPI Switch: Custom virtual handles (@flexipay), dynamic QR code generation, and instant camera scanning payments.
🔹 PCI-DSS Tokenized Card Vault: Zero raw PAN or CVV storage. Sensitive card numbers are tokenized in-memory; only masked tokens (•••• 4242) are vaulted.
🔹 Atomic Double-Entry Ledger: Database transactions with row-level locking (select_for_update) to guarantee balance integrity and eliminate race conditions.
🔹 Idempotent API Design: Enforcing Idempotency-Key headers on mutation endpoints to prevent duplicate charges on network retries.
🔹 Educational Fraud Detection: Real-time risk analysis for velocity bursts, high-ticket anomalies (>₹50,000), and consecutive failure patterns.
🔹 Merchant Hub & Hosted Links: 1-click shareable checkout links (/pay/xyz), analytics, and sandbox refund workflows.
🔹 Accessibility & Aesthetics: Built with React 19, TypeScript, and Tailwind CSS v4 featuring class-based Day/Night modes and WCAG compliance.

🛠️ Tech Stack:
• Backend: Python, Django REST Framework, SimpleJWT, Gunicorn, WhiteNoise
• Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide
• Architecture: RESTful APIs, RBAC (User / Merchant / Admin), Token Vaulting

🔗 Live Demo: [Insert Your Deployed URL Here]
💻 GitHub Repository: [Insert Your GitHub Repo URL Here]

I'd love to hear your feedback and thoughts!

#FullStackDevelopment #Fintech #WebDevelopment #Django #ReactJS #TypeScript #Python #SoftwareEngineering #Portfolio #OpenSource
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
