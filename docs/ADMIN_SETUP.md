# Gram Samadhan — Administrator Provisioning & RBAC Guide

This guide describes how to provision the first **Super Administrator**, assign Panchayat official roles, and manage permissions in Gram Samadhan.

---

## 1. Role-Based Access Control (RBAC) Architecture

Gram Samadhan defines three distinct administrator tiers:

| Role | Scope | Permitted Capabilities |
| :--- | :--- | :--- |
| `panchayat_admin` | Gram Panchayat Level | Review, assign, and update status of village complaints; add public messages and internal notes. |
| `block_admin` | Block / Taluka Level | Access complaints across all Panchayats within the block; audit resolution performance. |
| `super_admin` | District / State Level | Provision administrators, assign roles, configure village settings, and manage master records. |

> **Security Rule**: Roles are stored in `app_metadata.role` (managed solely by the service-role), never in `user_metadata` (which is client-mutable).

---

## 2. Disabling Public Admin Registration

To protect administrative routes from public self-registration:

1. Open **Supabase Dashboard** → **Authentication** → **Providers** → **Email**.
2. **Turn OFF** `Enable Email Signups` (Leave `Enable Email Provider` ON).
3. Now, accounts can only be created by an existing administrator or directly in the Supabase Dashboard.

---

## 3. Provisioning the Initial Super Administrator

### Step A: Create User in Supabase Auth
1. Go to **Authentication** → **Users** → **Add User** → **Create User**.
2. Enter the official email (e.g., `superadmin@panchayat.gov.in`) and a strong temporary password.
3. Check `Auto Confirm User` (so email verification is not required).
4. Copy the generated **User UID** (e.g., `e4c8b212-32a1-4fc3-9e41-0123456789ab`).

### Step B: Assign `super_admin` Role via SQL
Open the Supabase **SQL Editor** and run:

```sql
-- 1. Assign super_admin role in app_metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'
)
WHERE id = 'e4c8b212-32a1-4fc3-9e41-0123456789ab'; -- Replace with copied UID

-- 2. Create the admin_profiles record
INSERT INTO public.admin_profiles (id, full_name, role, village, phone)
VALUES (
  'e4c8b212-32a1-4fc3-9e41-0123456789ab',
  'मुख्य प्रशासनिक अधिकारी (Chief Admin)',
  'super_admin',
  'सुंदरपुर (Sundarpur)',
  '9876543210'
)
ON CONFLICT (id) DO UPDATE
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;
```

---

## 4. Provisioning Additional Panchayat Admins

Once the Super Admin account is active, subsequent administrators (Sarpanch, Gram Sachiv, Ward Assistants) can be provisioned using the secure `/admin-auth/promote-to-admin` Edge Function:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/admin-auth/promote-to-admin \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<NEW_USER_UID>",
    "role": "panchayat_admin",
    "full_name": "सुरेश कुमार (Gram Sachiv)",
    "village": "सुंदरपुर"
  }'
```

---

## 5. Logging In to the Admin Portal

1. Visit the portal at `/admin/login`.
2. Enter the administrator credentials.
3. Upon authentication, the system verifies `app_metadata.role`.
4. Authorized administrators are redirected to `/admin/dashboard`. Unauthorized users are rejected with `ERR_UNAUTHORIZED_ROLE`.

