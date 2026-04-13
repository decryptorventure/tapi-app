import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/owner', '/worker', '/onboarding', '/admin'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Check auth session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = request.nextUrl;

    // If on auth routes and already authenticated, redirect based on role and onboarding status
    if (authRoutes.some(route => pathname.startsWith(route)) && session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', session.user.id)
            .single();

        if (profile?.role === 'owner') {
            if (profile.onboarding_completed) {
                return NextResponse.redirect(new URL('/owner/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/owner/profile', request.url));
            }
        } else if (profile?.role === 'worker') {
            if (profile.onboarding_completed) {
                return NextResponse.redirect(new URL('/worker/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/worker/profile', request.url));
            }
        } else {
            return NextResponse.redirect(new URL('/onboarding/role', request.url));
        }
    }

    // Check protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!session) {
            const redirectUrl = new URL('/login', request.url);
            redirectUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed, is_admin')
            .eq('id', session.user.id)
            .single();

        if (pathname.startsWith('/onboarding') && profile?.onboarding_completed) {
            if (profile.role === 'owner') {
                return NextResponse.redirect(new URL('/owner/dashboard', request.url));
            } else if (profile.role === 'worker') {
                return NextResponse.redirect(new URL('/worker/dashboard', request.url));
            }
        }

        if (!pathname.startsWith('/onboarding') && !profile?.onboarding_completed) {
            if (profile?.role === 'owner') {
                return NextResponse.redirect(new URL('/onboarding/owner/profile', request.url));
            } else if (profile?.role === 'worker') {
                return NextResponse.redirect(new URL('/onboarding/worker/profile', request.url));
            } else {
                return NextResponse.redirect(new URL('/onboarding/role', request.url));
            }
        }

        if (pathname.startsWith('/owner') && profile?.role !== 'owner') {
            return NextResponse.redirect(new URL('/worker/dashboard', request.url));
        }

        if (pathname.startsWith('/worker') && profile?.role !== 'worker') {
            return NextResponse.redirect(new URL('/owner/dashboard', request.url));
        }

        if (pathname.startsWith('/admin') && !profile?.is_admin) {
            if (profile?.role === 'owner') {
                return NextResponse.redirect(new URL('/owner/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/worker/dashboard', request.url));
            }
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
