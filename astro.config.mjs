// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// Until www.bhineka.global is attached, Vercel exposes the project's production domain at build time,
// so canonical URLs and social preview images point at a host that actually serves them.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: productionHost ? `https://${productionHost}` : 'https://www.bhineka.global',
  output: 'static',
  adapter: vercel(),
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
      // Set by Vercel at runtime ('production' | 'preview' | 'development'); production refuses the test captcha key.
      VERCEL_ENV: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Cloudflare's always-pass test key is the fallback until the real key is configured.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
      GITHUB_OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GITHUB_OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
