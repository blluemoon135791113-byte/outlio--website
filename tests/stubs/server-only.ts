/**
 * Test stub for the `server-only` package.
 *
 * The real module throws when imported outside a React Server Component, which
 * is exactly the guard we want in the app — it makes the build fail if
 * `lib/supabase/admin.ts` ever becomes reachable from a Client Component.
 *
 * Vitest runs in plain Node, so that guard fires spuriously. Aliasing it to a
 * no-op lets server modules be unit-tested WITHOUT weakening the real build:
 * the alias exists only in vitest.config.mts.
 */
export {}
