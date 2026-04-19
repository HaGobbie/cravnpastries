/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    ⚠  SECURITY WARNING ⚠                        ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  This file creates a Supabase client using the SERVICE ROLE KEY. ║
 * ║                                                                  ║
 * ║  The service role key BYPASSES ALL Row Level Security (RLS)      ║
 * ║  policies and grants full database access. Never expose it to    ║
 * ║  end users or commit it to a public repository.                  ║
 * ║                                                                  ║
 * ║  CURRENT RISK:                                                   ║
 * ║  Because this runs in the browser via Vite, the service role     ║
 * ║  key will be bundled into the compiled JavaScript and can be     ║
 * ║  read by anyone who opens DevTools → Network tab or inspects     ║
 * ║  the built assets. This is acceptable ONLY if:                   ║
 * ║    1. admin.html is protected by a separate access mechanism     ║
 * ║       (e.g. Vercel password protection, IP allowlist), AND       ║
 * ║    2. you are fully aware of and accept the trade-off.           ║
 * ║                                                                  ║
 * ║  RECOMMENDED PRODUCTION APPROACH:                                ║
 * ║  Move createUser logic to a Supabase Edge Function or a          ║
 * ║  private server-side API route. The Edge Function receives the   ║
 * ║  new admin's details, verifies the caller is a super_admin via   ║
 * ║  their own JWT, then calls auth.admin.createUser() server-side   ║
 * ║  where the service role key is never exposed to the browser.     ║
 * ║                                                                  ║
 * ║  SETUP:                                                          ║
 * ║  Add the following line to your .env file:                       ║
 * ║                                                                  ║
 * ║    VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key    ║
 * ║                                                                  ║
 * ║  Find it in: Supabase Dashboard → Settings → API →              ║
 * ║  "service_role" (secret) — NOT the anon key.                     ║
 * ║                                                                  ║
 * ║  Also add it to your .gitignore / deployment env vars and        ║
 * ║  NEVER commit the actual key value to version control.           ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error(
    '[supabaseAdmin] VITE_SUPABASE_SERVICE_ROLE_KEY is not set in your .env file.\n' +
    'User Management features will not work until you add it.\n' +
    'See src/lib/supabaseAdmin.js for setup instructions.'
  );
}

/**
 * Service-role client — used exclusively for:
 *   • supabaseAdmin.auth.admin.createUser()   (create new admins)
 *   • supabaseAdmin.auth.admin.listUsers()    (list auth users for display)
 *   • supabaseAdmin.auth.admin.deleteUser()   (optional future use)
 *
 * Do NOT use this client for regular data reads/writes — use the
 * normal `supabase` client from lib/supabase.js for those.
 */
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY ?? '',
  {
    auth: {
      /* Prevent the admin client from interfering with the current
         user's session stored in localStorage by the normal client. */
      autoRefreshToken:  false,
      persistSession:    false,
      detectSessionInUrl: false,
    },
  }
);
