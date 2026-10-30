// @ts-check
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// Until www.bhineka.global is attached, Vercel exposes the project's production domain at build time,
// so canonical URLs and social preview images point at a host that actually serves them.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

/**
 * Fails a production build when any page is missing the GTM tag (or carries it twice), so a new page that
 * skips src/layouts/Base.astro never ships untracked. /admin is the internal CMS and stays untracked.
 * @returns {import('astro').AstroIntegration}
 */
const requireGtm = () => ({
  name: 'require-gtm',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      if (process.env.VERCEL_ENV !== 'production') return;
      const root = fileURLToPath(dir);
      const pages = (await readdir(root, { recursive: true })).filter(
        (f) => f.endsWith('.html') && !f.startsWith('admin'),
      );
      const bad = [];
      for (const page of pages) {
        const count = (await readFile(`${root}/${page}`, 'utf8')).split('GTM-5MCN5ZMD').length - 1;
        if (count !== 1) bad.push(`${page} (${count}x)`);
      }
      if (bad.length) {
        throw new Error(`Google Tag Manager must appear exactly once per page; use layouts/Base.astro: ${bad.join(', ')}`);
      }
      logger.info(`GTM present on all ${pages.length} pages`);
    },
  },
});

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : 'https://www.bhineka.global',
  output: 'static',
  adapter: vercel(),
  integrations: [requireGtm()],
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // Astro's built-in origin check rejects every form POST behind Vercel's proxy. The only POST endpoint is
  // the public contact form, which carries no session or cookies, and is guarded by Turnstile instead.
  security: { checkOrigin: false },
  env: {
    schema: {
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 465 }),
      SMTP_SECURE: envField.boolean({ context: 'server', access: 'secret', default: true }),
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_TO: envField.string({ context: 'server', access: 'secret', default: 'info@bhineka.global' }),
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Cloudflare's always-pass test key is the fallback until the real key is configured.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
      GITHUB_OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
