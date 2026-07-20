# Local learning-data ownership

Private local rows are account-owned. Dexie v21 requires a `userId` on chat,
coach words, pronunciation queue/seen/mastery, AI events and sync-outbox rows.
Queries must receive that id; a missing id yields no renderable state.

During the v21 upgrade, rows from formerly global private stores are copied to
`localDataQuarantine` and removed from their live store unless their ownership
is already represented by an explicit `userId` (or outbox `user_id`). The
quarantine is deliberately not rendered and is retained for future recovery;
the first account to sign in must never inherit it.

`practicePrefs` and generated exercise content are device-global presentation
or content caches. They must not contain learning evidence. Auth subtree remount
on account changes disposes reactive bindings before the next account renders,
and sign-out attempts a bounded flush for the outgoing user without deleting
unsynced namespaced rows. `ai_events` and `ai_conversations` deliberately have
no outbox target: no matching Supabase migration/RLS exists, so they remain
user-scoped local evidence instead of reporting a false synchronization.
