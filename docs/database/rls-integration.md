# RLS Integration Check

Last run: 2026-07-05.

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
not run it against production unless temporary test users are acceptable.

## 2026-07-05 Result

The check failed against the currently linked remote project:

```text
RLS integration checks failed: user B can read user A STT cache
```

`supabase migration list` showed the linked remote database has not applied
many local migrations from `20260610120000` onward, including
`20260621140000_stt_cache_scope_per_user.sql`, which scopes
`stt_transcription_cache` by `user_id` and adds authenticated-user policies.

## Next Step

Apply missing migrations to a staging database first, rerun
`pnpm test:rls:integration`, then decide whether to promote the migration set
to production. Avoid running `supabase db push` against a shared production
project without reviewing the full migration diff.
