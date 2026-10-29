import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID } from 'astro:env/server';

export const prerender = false;

// Step 1 of the Decap CMS GitHub login: send the editor to GitHub's consent screen.
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  if (!GITHUB_OAUTH_CLIENT_ID) return new Response('GitHub OAuth belum dikonfigurasi.', { status: 500 });

  const state = crypto.randomUUID();
  cookies.set('cms_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api', maxAge: 600 });

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', new URL('/api/callback', url.origin).toString());
  authorize.searchParams.set('scope', 'repo,user');
  authorize.searchParams.set('state', state);
  return redirect(authorize.toString(), 302);
};
