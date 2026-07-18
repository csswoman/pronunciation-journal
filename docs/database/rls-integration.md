# RLS Integration Check

Last attempt: 2026-07-17.

## Command

```bash
pnpm test:rls:integration
```

The script creates two temporary Supabase Auth users, signs in with real
authenticated JWTs, writes private rows, verifies cross-user isolation, and
deletes the temporary users and rows in `finally`.

Required environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The script can run against Supabase local or an isolated staging project. Do
not run it against production. The runner creates temporary users and rows.

## 2026-07-17 Environment Check

The linked remote migration history is aligned, but the integration runner was
not pointed at that database because it is the production project. The local
check could not start because Docker Desktop/the Docker daemon was unavailable,
and no isolated staging credentials are configured on this workstation.

This is an environment blocker, not a passing RLS result.

## Historical 2026-07-05 Result

The check failed against the currently linked remote project:

```text
RLS integration checks failed: user B can read user A STT cache
```

At that time, `supabase migration list` showed the linked remote database had not applied
many local migrations from `20260610120000` onward, including
`20260621140000_stt_cache_scope_per_user.sql`, which scopes
`stt_transcription_cache` by `user_id` and adds authenticated-user policies.

## Next Step

Start Docker Desktop and run `pnpm exec supabase start`, then export the local
API URL, anon key and service-role key before running
`pnpm test:rls:integration`. An isolated staging project is also valid. Never
fall back to the linked production project when the local stack is unavailable.
