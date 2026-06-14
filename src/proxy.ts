import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

// `/install` is public so users can read install instructions before signing in.
const PUBLIC_PATHS = ['/login', '/auth/callback', '/m', '/install'];

function pathWithoutLocale(pathname: string) {
  const match = pathname.match(/^\/(fa|en)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] ?? '/';
}

function localeFromPath(pathname: string) {
  const match = pathname.match(/^\/(fa|en)/);
  return match?.[1] ?? routing.defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subpath = pathWithoutLocale(pathname);
  const hasSession = request.cookies.get('bc_session')?.value === '1';

  // The root path is the public marketing landing. Signed-in visitors are sent
  // straight into the app feed; everyone else sees the landing page.
  // `?preview=1` lets a signed-in dev view the landing without being redirected.
  if (subpath === '/') {
    const preview = request.nextUrl.searchParams.get('preview') === '1';
    if (hasSession && !preview) {
      const locale = localeFromPath(pathname);
      return NextResponse.redirect(new URL(`/${locale}/feed`, request.url));
    }
    return handleI18nRouting(request);
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => subpath === p || subpath.startsWith(`${p}/`),
  );

  if (!isPublic && !hasSession) {
    const locale = localeFromPath(pathname);
    const login = new URL(`/${locale}/login`, request.url);
    if (subpath !== '/') {
      login.searchParams.set('from', subpath);
    }
    return NextResponse.redirect(login);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/', '/(fa|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
