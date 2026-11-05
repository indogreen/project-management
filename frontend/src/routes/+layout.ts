import { redirect } from '@sveltejs/kit';

export const ssr = false;
export const prerender = false;

export async function load({ url }) {
  const pathname = url.pathname;
  // Allow auth routes (login, register, forgot, etc.) to load without a token.
  if (pathname.startsWith('/auth')) {
    return {};
  }
  // Access token from localStorage. Note: this only runs client-side because
  // SSR is disabled.
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    // Redirect unauthenticated users to the login page.
    // Omit redirect callback when visiting root ('/') so URL remains clean.
    const redirectUrl =
      url.pathname === '/'
        ? '/auth/login'
        : `/auth/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(307, redirectUrl);
  }
  return {};
}
