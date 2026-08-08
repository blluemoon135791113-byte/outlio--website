import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests hit a real Supabase project and must not race each
    // other while creating and deleting users.
    fileParallelism: false,
    testTimeout: 30_000,
    // Cleanup hooks delete every user and code a suite created. Vitest's 10s
    // default is not enough for that against a remote project, and a timed-out
    // afterAll leaves orphaned rows behind.
    hookTimeout: 60_000,
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, '.'),
      // `server-only` throws outside a React Server Component. That guard is
      // correct in the app — it breaks the build if the service-role client
      // ever becomes client-reachable — but fires spuriously under plain Node.
      // Stubbing it HERE only affects tests; the real guard still applies to
      // `npm run build`.
      'server-only': resolve(rootDir, 'tests/stubs/server-only.ts'),
    },
  },
})
