/**
 * Test setup. Loads .env.local so integration tests can reach Supabase.
 *
 * .env.local is gitignored. CI must supply the same variables as secrets.
 */
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
