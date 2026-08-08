/**
 * Session refresh + AUTHENTICATION guard.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`; the function
 * must be named `proxy` or be the default export.
 *
 * ⚠️ THIS IS NOT AN AUTHORIZATION BOUNDARY.
 *
 * This only answers "is there a signed-in user?" and refreshes the session
 * cookie. Every real access decision — role, plan, expiry, suspension, limits —
 * happens in the route via `lib/auth/access.ts`, on the server.
 *
 * Treating this as the security boundary is the classic Next.js mistake: it can
 * run at the CDN edge, is separate from render code, and does not see the
 * database. Next's own docs call it "a last resort".
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/admin']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // Without configuration we cannot refresh a session; let the route decide.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refreshes the session cookie as a side effect. Must be getUser(), not
  // getSession() — getSession does not revalidate the token with the server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (isProtected && !user) {
    const signIn = request.nextUrl.clone()
    signIn.pathname = '/sign-in'
    signIn.searchParams.set('next', pathname)
    return NextResponse.redirect(signIn)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Keeping the matcher
     * narrow matters: this runs on every request.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
