import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_TO,
  MAIL_FROM,
  TURNSTILE_SECRET_KEY,
  VERCEL_ENV,
} from 'astro:env/server';
import { mailBodies, mailSubject, parseInquiry, verifyTurnstile } from '../../lib/contact';
import site from '../../content/settings/site.json';

export const prerender = false;

const reply = (status: number, ok: boolean, message: string) =>
  new Response(JSON.stringify({ ok, message }), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, false, 'Permintaan tidak valid.');
  }

  // Honeypot filled → silently accept so bots learn nothing.
  if (String(form.get('website') ?? '').trim()) return reply(200, true, 'OK');

  // The always-pass test key is for local and preview only: without a real secret, production takes no inquiries.
  if (!TURNSTILE_SECRET_KEY && VERCEL_ENV === 'production') {
    console.error('[contact] TURNSTILE_SECRET_KEY is not set in production; inquiry refused.');
    return reply(503, false, `Formulir sedang dalam perbaikan. Silakan email kami langsung di ${site.email}.`);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress;
  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!token || !(await verifyTurnstile(token, TURNSTILE_SECRET_KEY, ip).catch(() => false))) {
    return reply(400, false, 'Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.');
  }

  const { data, error } = parseInquiry(form);
  if (!data) return reply(400, false, error ?? 'Data tidak valid.');

  // Services such as Resend log in with a non-address user, so the sender then has to come from MAIL_FROM.
  const from = MAIL_FROM || SMTP_USER;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !from?.includes('@')) {
    console.error('[contact] SMTP is not configured (host, user, password and a MAIL_FROM address); inquiry not sent.');
    return reply(503, false, `Formulir sedang dalam perbaikan. Silakan email kami langsung di ${site.email}.`);
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const { text, html } = mailBodies(data, new Date());

  try {
    await transporter.sendMail({
      from: { name: 'Website BIG', address: from },
      to: MAIL_TO,
      replyTo: { name: data.name, address: data.email },
      subject: mailSubject(data),
      text,
      html,
    });
  } catch (err) {
    console.error('[contact] sendMail failed:', err);
    return reply(502, false, `Pesan gagal terkirim. Silakan coba lagi atau email kami di ${site.email}.`);
  }

  return reply(200, true, 'Terkirim');
};
