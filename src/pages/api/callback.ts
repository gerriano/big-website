import type { APIRoute } from 'astro';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET } from 'astro:env/server';

export const prerender = false;

// Step 2: exchange GitHub's code for a token and hand it to the Decap window that opened this popup.
const page = (status: 'success' | 'error', payload: object, origin: string) => {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return new Response(
    `<!doctype html><html><body><script>
(function () {
  var origin = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(${JSON.stringify(message)}, origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', origin);
})();
</script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
};

export const GET: APIRoute = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = cookies.get('cms_oauth_state')?.value;
  cookies.delete('cms_oauth_state', { path: '/api' });

  if (!code || !state || state !== expected) {
    return page('error', { message: 'Sesi login tidak valid. Silakan coba lagi.' }, url.origin);
  }
  if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_CLIENT_SECRET) {
    return page('error', { message: 'GitHub OAuth belum dikonfigurasi.' }, url.origin);
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_OAUTH_CLIENT_ID, client_secret: GITHUB_OAUTH_CLIENT_SECRET, code }),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!json.access_token) {
    return page('error', { message: json.error_description || 'Gagal login ke GitHub.' }, url.origin);
  }
  return page('success', { token: json.access_token, provider: 'github' }, url.origin);
};
