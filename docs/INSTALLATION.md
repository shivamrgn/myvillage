# Gram Samadhan — Installation Guide

This guide provides step-by-step instructions for installing dependencies and preparing the environment for **Gram Samadhan**.

---

## 1. Prerequisites

Ensure your development machine has the following installed:

* **Node.js**: Version `18.0.0` or higher (Tested on `v22.18.0`).
* **npm**: Version `9.0.0` or higher.
* **Git**: Modern version of Git.
* **Supabase CLI** *(Optional for local database development)*:
  ```bash
  npm install -g supabase
  ```

---

## 2. Clone the Repository

```bash
git clone https://github.com/your-org/gram-samadhan.git
cd gram-samadhan
```

---

## 3. Install NPM Dependencies

Run the standard install command:

```bash
npm install
```

### Key Dependencies Installed:
* `react` & `react-dom` (`^18.3.1`): Core UI library.
* `react-router-dom` (`^6.28.0`): Client-side routing and layout management.
* `@supabase/supabase-js` (`^2.46.1`): Official client for PostgreSQL, Auth, and Storage.
* `lucide-react` (`^0.460.0`): Icon system.
* `tailwindcss` (`^3.4.15`), `postcss`, and `autoprefixer`: Utility-first responsive design.
* `vite` (`^5.4.11`): Build tool and development server.

---

## 4. Configure Environment Variables

Create your local configuration by copying the example template:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your environment:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Panchayat Details
VITE_APP_PANCHAYAT_NAME=ग्राम पंचायत सुंदरपुर (Sundarpur)
VITE_APP_HELPLINE=1800-180-1555
VITE_DEFAULT_LANGUAGE=hi

# Notification Service
VITE_SMS_PROVIDER=mock
```

> **Note**: If you leave `VITE_SUPABASE_URL` unset, Gram Samadhan automatically runs in **Offline Demo Mode**, utilizing browser `localStorage` with pre-seeded village grievances.

---

## 5. Verify the Installation

Run the automated test suite to ensure all core modules, validation rules, and security controls are operating correctly:

```bash
npm test
```

Expected output:
```
QA DEPLOYMENT TEST SUITE SUMMARY:
  TOTAL PASSED: 109
  TOTAL FAILED: 0

TRACKING & SECURITY VERIFICATION:
  TOTAL PASSED: 84
  TOTAL FAILED: 0
```

Build the production bundle:

```bash
npm run build
```

The output assets will be generated in the `dist/` directory.

---

## 6. Next Steps

* To run the application locally, refer to the [Local Development Guide](./LOCAL_DEVELOPMENT.md).
* To set up Supabase and deploy database migrations, see the [Supabase Setup Guide](./SUPABASE_SETUP.md).

