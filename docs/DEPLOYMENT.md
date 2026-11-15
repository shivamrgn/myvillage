# Gram Samadhan — Production Deployment Guide (Vercel & Supabase)

This guide walks through deploying **Gram Samadhan** to **Vercel** with a production **Supabase** backend.

---

## 1. Deployment Architecture

* **Frontend**: Hosted on [Vercel](https://vercel.com) (Global Edge Network, automatic HTTPS, SPA rewrites).
* **Database & Auth**: Hosted on [Supabase](https://supabase.com) (PostgreSQL with RLS, GoTrue Auth, Storage).
* **Serverless Compute**: Supabase Edge Functions (Deno runtime).

---

## 2. Pre-Deployment Verification

Before triggering production deployment, verify all test suites and builds pass locally:

```bash
# 1. Run all 193 automated QA, tracking, and security tests
npm test

# 2. Test production compilation
npm run build
```

Ensure `dist/index.html` and split vendor chunks (`vendor-react`, `vendor-supabase`, `vendor-icons`) are generated without warnings or errors.

---

## 3. Database Deployment (Supabase)

1. Create a production Supabase project at [database.new](https://database.new).
2. Apply database migrations:
   ```bash
   supabase link --project-ref your-prod-ref
   supabase db push
   ```
3. Deploy Supabase Edge Functions:
   ```bash
   supabase functions deploy submit-complaint --no-verify-jwt
   supabase functions deploy track-complaint --no-verify-jwt
   supabase functions deploy transcribe-audio --no-verify-jwt
   supabase functions deploy admin-complaints
   supabase functions deploy admin-auth
   ```
4. Set production secrets:
   ```bash
   supabase secrets set \
     SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
     ALLOWED_ORIGIN="https://your-gram-samadhan.vercel.app"
   ```

---

## 4. Frontend Deployment to Vercel

### Method A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Authenticate
vercel login

# Link and deploy
vercel

# Deploy to production
vercel --prod
```

### Method B: Deploy via Vercel Dashboard (GitHub Integration)

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New Project**.
3. Select the `gram-samadhan` repository.
4. Configure Project Settings:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Configure **Environment Variables** in Vercel:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-ref.supabase.co` | Production Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Public Anonymous Key |
| `VITE_APP_PANCHAYAT_NAME` | `ग्राम पंचायत सुंदरपुर` | Official Panchayat Title |
| `VITE_APP_HELPLINE` | `1800-180-1555` | Citizen Toll-Free Helpline |
| `VITE_DEFAULT_LANGUAGE` | `hi` | Default Locale (`hi` or `en`) |
| `VITE_SMS_PROVIDER` | `mock` or `fast2sms` | Notification Gateway Provider |

6. Click **Deploy**.

---

## 5. Vercel Configuration Highlights (`vercel.json`)

Gram Samadhan includes [`vercel.json`](file:///Users/shivamkumar/grampanchayat/vercel.json) pre-configured with:

1. **SPA Route Fallback**:
   ```json
   "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   ```
   Ensures deep links like `/track`, `/report`, `/privacy`, and `/admin/dashboard` resolve correctly on page reload.

2. **Security Headers**:
   * `X-Frame-Options: DENY`: Prevents clickjacking attacks.
   * `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
   * `Strict-Transport-Security`: Enforces HTTPS for 1 year.
   * `Permissions-Policy: microphone=(self)`: Allows microphone capture on your verified domain while blocking unauthorized iframes.

3. **Asset Caching**:
   * `/assets/(.*)` cached with `Cache-Control: public, max-age=31536000, immutable`.

---

## 6. Post-Deployment Verification Checklist

After deployment succeeds:
- [ ] Visit `https://your-domain.vercel.app/` over HTTPS.
- [ ] Toggle language between Hindi and English.
- [ ] Test microphone permission prompt and live speech-to-text.
- [ ] Submit a test grievance and record the generated Ticket Code (`GS-YYYY-XXXX`).
- [ ] Navigate directly to `https://your-domain.vercel.app/track` and verify grievance status.
- [ ] Log in at `/admin/login` using your provisioned Super Admin credentials.
- [ ] Change complaint status to `in_progress` and verify status history logs.

