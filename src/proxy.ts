import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_PATHS = ['/login', '/auth/callback', '/m'];

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
  const isPublic = PUBLIC_PATHS.some(
    (p) => subpath === p || subpath.startsWith(`${p}/`),
  );
  const hasSession = request.cookies.get('bc_session')?.value === '1';

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
  matcher: ['/', '/(fa|en)/:path*'],
};
