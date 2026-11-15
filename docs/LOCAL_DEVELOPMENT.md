# Gram Samadhan — Local Development Guide

This guide covers running, developing, and debugging **Gram Samadhan** locally in both **Demo Mode** and with a connected **Supabase Backend**.

---

## 1. Running in Zero-Config Demo Mode

Gram Samadhan features a zero-dependency demo mode that requires no external database or API keys to test:

1. Ensure `.env.local` does not define `VITE_SUPABASE_URL` (or leave it with default placeholders).
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

### Demo Mode Characteristics:
* **Grievance Persistence**: Complaints are stored in browser `localStorage` under `gram_samadhan_grievances_v2`.
* **Pre-seeded Grievances**: Sample complaints in Hindi and English covering drinking water, streetlights, and drainage.
* **Audio Notes**: Voice recordings are captured in memory as Object URLs for instant preview and playback.
* **Mock AI Speech-to-Text**: Voice notes transcribe into contextual Hindi/English grievance text automatically.
* **Admin Dashboard**: Click **Admin Login** (`/admin/login`) and enter any email/password to log in as the Panchayat Secretary (`Gram Sachiv`).
* **Interactive SMS Simulation**: Outbound notifications are logged directly to the browser DevTools console.

---

## 2. Running with a Connected Supabase Backend

To connect to your cloud Supabase project or local Supabase CLI instance:

1. Set your Supabase credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. The application will detect the configuration and automatically route requests to PostgreSQL and Edge Functions instead of `localStorage`.

---

## 3. Running with Local Supabase CLI

For complete local offline full-stack development:

```bash
# Initialize and start local containers (Postgres, GoTrue, Kong, Storage)
supabase start

# Apply database migrations to local Postgres
supabase db reset

# Serve Edge Functions locally
supabase functions serve
```

Update `.env.local` with local endpoints:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-status
```

---

## 4. Key Development Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local server with Hot Module Replacement (HMR) on port `5173`. |
| `npm run build` | Compiles production assets into `dist/` with chunk splitting. |
| `npm run preview` | Serves the production build locally to test bundle behavior. |
| `npm test` | Runs the full QA, DevOps, and tracking test suite (193 automated tests). |

---

## 5. Testing Speech & Media APIs Locally

* **Web Speech API (`SpeechRecognition`)**: Supported in Google Chrome, Microsoft Edge, and Android Chrome. Localhost is treated as a secure origin (`isSecureContext === true`), allowing microphone testing without SSL.
* **MediaRecorder API**: Captures `audio/webm;codecs=opus` in Chrome/Firefox and `audio/mp4` in Safari.
* **Microphone Permissions**: Ensure microphone access is allowed in your browser address bar.

