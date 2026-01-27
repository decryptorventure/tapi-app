import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin emails - hardcoded for now
const ADMIN_EMAILS = ['admin@tapi.vn', 'tommy@example.com'];

// Routes that require authentication
const protectedRoutes = ['/owner', '/worker', '/onboarding', '/admin'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/signup'];


export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Check auth session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;

    // Remove homepage redirect - allowing public access
    // if (pathname === '/' && !session) { ... }

    // If on auth routes and already authenticated, redirect based on role and onboarding status
    if (authRoutes.some(route => pathname.startsWith(route)) && session) {
        // Get user profile to check role and onboarding status
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', session.user.id)
            .single();

        if (profile?.role === 'owner') {
            if (profile.onboarding_completed) {
                return NextResponse.redirect(new URL('/owner/dashboard', req.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/owner/profile', req.url));
            }
        } else if (profile?.role === 'worker') {
            if (profile.onboarding_completed) {
                return NextResponse.redirect(new URL('/worker/dashboard', req.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/worker/profile', req.url));
            }
        } else {
            // No role yet, go to role selection
            return NextResponse.redirect(new URL('/onboarding/role', req.url));
        }
    }

    // Check protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!session) {
            // Not authenticated - redirect to login
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Get user profile for role-based access and onboarding check
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', session.user.id)
            .single();

        // Redirect away from onboarding if already completed
        if (pathname.startsWith('/onboarding') && profile?.onboarding_completed) {
            if (profile.role === 'owner') {
                return NextResponse.redirect(new URL('/owner/dashboard', req.url));
            } else if (profile.role === 'worker') {
                return NextResponse.redirect(new URL('/worker/dashboard', req.url));
            }
        }

        // Force onboarding if not completed and trying to access dashboard/other protected areas
        // Exception: allow accessing onboarding routes themselves
        if (!pathname.startsWith('/onboarding') && !profile?.onboarding_completed) {
            if (profile?.role === 'owner') {
                return NextResponse.redirect(new URL('/onboarding/owner/profile', req.url));
            } else if (profile?.role === 'worker') {
                return NextResponse.redirect(new URL('/onboarding/worker/profile', req.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/role', req.url));
            }
        }

        // Owner routes - require owner role
        if (pathname.startsWith('/owner') && profile?.role !== 'owner') {
            return NextResponse.redirect(new URL('/worker/dashboard', req.url));
        }

        // Worker routes - require worker role
        if (pathname.startsWith('/worker') && profile?.role !== 'worker') {
            return NextResponse.redirect(new URL('/owner/dashboard', req.url));
        }
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
