import 'server-only'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SERVICE ROLE CLIENT — THIS BYPASSES ROW LEVEL SECURITY ENTIRELY.        ║
 * ║                                                                          ║
 * ║  RLS IS NOT PROTECTING YOU HERE. Every query made with this client must  ║
 * ║  scope by `user_id` IN APPLICATION CODE. Forgetting to do so is a        ║
 * ║  cross-tenant data breach, not a bug.                                    ║
 * ║                                                                          ║
 * ║      ✅  .from('extracted_leads').select().eq('user_id', userId)          ║
 * ║      ❌  .from('extracted_leads').select()                                ║
 * ║                                                                          ║
 * ║  Reach for `server.ts` instead unless you specifically need to bypass    ║
 * ║  RLS. Legitimate uses: the worker, admin actions, and usage counters.    ║
 * ║                                                                          ║
 * ║  The `server-only` import above makes the build fail if this module is   ║
 * ║  ever reachable from a Client Component.                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This is server/worker only and must ' +
        'never be prefixed NEXT_PUBLIC_.',
    )
  }

  if (serviceRoleKey === 'PASTE_SERVICE_ROLE_KEY_HERE') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is still the placeholder value. Set the real ' +
        'key in .env.local.',
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
