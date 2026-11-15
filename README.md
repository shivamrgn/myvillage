<<<<<<< HEAD
# 🌾 ग्राम समाधान (Gram Samadhan)
### Village Grievance Reporting & Redressal System

**Gram Samadhan** is a production-ready, voice-enabled civic web application built to empower rural Indian citizens. Villagers can report local civic grievances (drinking water, roads, electricity, sanitation, healthcare, schooling) using **live speech-to-text or voice recordings in Hindi and English**, track grievance status transparently with an automated ticket ID, and enable Gram Panchayat administrators (Sarpanch, Gram Sachiv, Block Officers) to review, assign, and resolve civic complaints.

---

## 🏛️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│   React 18 + Vite + Tailwind CSS + Lucide Icons              │
│   • Bilingual (Hindi / English) with instantaneous switching │
│   • Mobile-First Responsive Layouts (320px to 1920px)        │
│   • WCAG Compliant Touch Targets (min 48px) & High Contrast  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                    VOICE & SPEECH SUBSYSTEM                  │
│   • Real-Time Dictation: Web Speech API (hi-IN & en-IN)      │
│   • Voice Recording: MediaRecorder API (audio/webm, opus)    │
│   • Cloud STT Adapter: Groq / OpenAI Whisper / GCP Speech    │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                 BUSINESS LOGIC & STATE LAYER                 │
│   • Contexts: LanguageContext, AuthContext, ToastContext     │
│   • Custom Hooks: useSpeechRecognition, useAudioRecorder     │
│   • Services: complaintService, notificationService, etc.    │
│   • Resilient Zero-Config Demo Mode via LocalStorage         │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│               BACKEND & STORAGE LAYER (Supabase)             │
│   • PostgreSQL Database with Row-Level Security (RLS)        │
│   • Immutable Audit Trigger & Auto-Purge Functions           │
│   • Private Storage: 'audio-recordings', 'attachments'       │
│   • Serverless Edge Functions (Deno / TypeScript)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation Index

Comprehensive guides for every aspect of the project:

| Guide | Description |
| :--- | :--- |
| [**Installation Guide**](./docs/INSTALLATION.md) | System prerequisites, dependencies, and environment setup. |
| [**Local Development Guide**](./docs/LOCAL_DEVELOPMENT.md) | Running locally in Zero-Config Demo Mode vs Connected Supabase. |
| [**Supabase Backend Setup**](./docs/SUPABASE_SETUP.md) | Database migrations, RLS policies, storage buckets, and Edge Functions. |
| [**Administrator Setup & RBAC**](./docs/ADMIN_SETUP.md) | Provisioning initial Super Admin, role management, and access gates. |
| [**Speech-to-Text Configuration**](./docs/SPEECH_TO_TEXT_GUIDE.md) | Web Speech API, Whisper, Groq, and audio-only fallbacks. |
| [**Production Deployment Guide**](./docs/DEPLOYMENT.md) | Deploying to Vercel and configuring production Supabase. |
| [**Secrets & Hardening Guide**](./supabase/SECRETS_GUIDE.md) | Managing CLI secrets, private buckets, and secret rotation. |
| [**Comprehensive QA Testing Report**](./docs/TESTING_REPORT.md) | Full 193-test verification matrix across workflows, viewports, and security. |

---

## 🚀 Quick Start (Zero-Config Demo Mode)

You can run Gram Samadhan locally without any database credentials or cloud accounts:

```bash
# 1. Clone repository
git clone https://github.com/your-org/gram-samadhan.git
cd gram-samadhan

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

* Grievances are stored in `localStorage` with pre-seeded demo records.
* Speech recognition works in supported browsers (Chrome, Edge).
* Admin Portal (`/admin/login`) can be accessed with any credentials.

---

## 🧪 Automated Testing

Gram Samadhan includes an automated test harness covering functional workflows, responsive ergonomics, browser codecs, permissions, rate limiting, and security checks:

```bash
# Run the complete test suite (193 tests)
npm test
```

### Test Suite Summary:
* **QA & Deployment Tests**: 109 tests passed (`test/qaDeploymentTest.mjs`)
* **Tracking & Security Tests**: 84 tests passed (`test/verifyTracking.mjs`)
* **Total**: **193 passed, 0 failed**

---

## 🛡️ Security & Privacy Highlights

* **Row Level Security (RLS)**: Public anonymous clients cannot list complaints directly; reads and status updates require verified admin JWTs.
* **Phone & Identity Masking**: Public tracking screens redact phone numbers (`1234......`) and names (`र****द श***ा`).
* **2-Step Verification**: Citizens verify with their phone's last 4 digits to unlock unmasked information and audio playback.
* **Private Storage**: Audio notes reside in non-public storage buckets and are accessed only via 10-minute temporary signed URLs.
* **Magic Bytes Validation**: Audio uploads are inspected for WebM, OGG, WAV, MP3, and MP4 signatures before storage, rejecting spoofed executables or scripts.
* **Rate Limiting & Lockout**: Submissions capped at 5 per 10 minutes; tracking lookups trigger a 10-minute IP lockout after 6 consecutive misses.
* **Immutable Audit Trail**: Database triggers block `UPDATE` and `DELETE` queries on grievance history (`complaint_updates`).

---

## ☁️ Deployment (Vercel)

Gram Samadhan is ready for instant deployment to Vercel with pre-configured [`vercel.json`](./vercel.json):

```bash
# Production build
npm run build

# Deploy via Vercel CLI
vercel --prod
```

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project Settings. Deep routing, security headers, and asset caching are handled automatically.

---

## 📄 License & Public Service

Built for Gram Panchayats and rural citizen empowerment under responsive governance standards.
=======
# grampanchayat
>>>>>>> origin/main
