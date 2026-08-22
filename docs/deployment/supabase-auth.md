# Supabase Auth Configuration & Deployment Guide

## Overview

The authentication policy is aligned between client-side validation, CLI local configuration (`supabase/config.toml`), and production requirements.

> [!IMPORTANT]
> Settings in `supabase/config.toml` apply only to the local Supabase CLI environment.
> When deploying to hosted Supabase, the following settings must be verified and configured manually in the Supabase Dashboard.

## Required Remote Dashboard Settings

Navigate to **Authentication** in the Supabase Dashboard:

### 1. Password Policy (Authentication -> Security)
- **Minimum password length**: `10`
- **Password requirements**: Require lowercase, uppercase, and digits (`lower_upper_letters_digits`)
- **Prevent password reuse / Secure password change**: Enabled (requires recent login to change password)

### 2. Email Auth (Authentication -> Providers -> Email)
- **Enable Email provider**: Enabled
- **Confirm email**: Enabled (`enable_confirmations = true`)
- **Secure email change (Double confirm)**: Enabled

### 3. Anonymous Sign-ins (Authentication -> Providers -> Anonymous)
- **Enable Anonymous Sign-ins**: Enabled (required for guest preview and onboarding)
- **Manual Linking**: Enabled (`enable_manual_linking = true` to allow upgrading anonymous guests to Google/Email accounts without losing progress)

## Client Validation Reference

The client enforces these same rules prior to submission via `lib/auth/password-policy.ts`:
- Minimum length: 10 characters
- Character sets: At least 1 lowercase `[a-z]`, 1 uppercase `[A-Z]`, and 1 digit `[0-9]`

## Administrator seeding

Privileged roles live in `public.user_roles` (service-role only) and/or
`auth.users.raw_app_meta_data.role`. Do **not** copy values from
`user_profiles.role` — that column was historically client-writable and is not
a trustworthy authorization source.

After applying `20260821090000_secure_user_profiles_and_roles.sql`, audit each
candidate administrator out-of-band, then seed explicitly with the service role:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<audited-user-uuid>', 'admin')
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role, updated_at = now();
```

Alternatively set `raw_app_meta_data.role = 'admin'` via the Auth Admin API.
Remote RLS / Auth Dashboard settings must be verified separately; local
migrations alone do not prove hosted policy behavior.
