import site from '../content/settings/site.json';

export interface Inquiry {
  category: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const LIMITS: Record<keyof Inquiry, number> = {
  category: 80,
  name: 120,
  company: 160,
  email: 160,
  phone: 30,
  subject: 150,
  message: 5000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-\s]{8,30}$/;

/** Strip CR/LF so values can never inject extra mail headers. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export function parseInquiry(form: FormData): { data?: Inquiry; error?: string } {
  const get = (k: keyof Inquiry) => String(form.get(k) ?? '').trim().slice(0, LIMITS[k]);
  const data: Inquiry = {
    category: oneLine(get('category')),
    name: oneLine(get('name')),
    company: oneLine(get('company')),
    email: oneLine(get('email')),
    phone: oneLine(get('phone')),
    subject: oneLine(get('subject')),
    message: get('message'),
  };

  if (!site.inquiryCategories.includes(data.category)) return { error: 'Kategori inquiry tidak valid.' };
  if (!data.name || !data.subject || !data.message) return { error: 'Mohon lengkapi semua kolom wajib.' };
  if (!EMAIL_RE.test(data.email)) return { error: 'Alamat email tidak valid.' };
  if (!PHONE_RE.test(data.phone)) return { error: 'Nomor telepon tidak valid.' };
  return { data };
}

/** Subject line format requested by BIG: "[Kategori] Subjek". */
export const mailSubject = (d: Inquiry) => `[${d.category}] ${d.subject}`;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function mailBodies(d: Inquiry, date: Date) {
  const rows: [string, string][] = [
    ['Kategori', d.category],
    ['Nama', d.name],
    ['Perusahaan / Toko', d.company || '-'],
    ['Email', d.email],
    ['Telepon / WhatsApp', d.phone],
    ['Subjek', d.subject],
  ];
  const when = date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' });

  const text = [
    'Inquiry baru dari website bhineka.global',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Pesan:',
    d.message,
    '',
    `Dikirim: ${when} WIB`,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#0b1d33">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fa;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#003665;padding:22px 28px;color:#fff;font-size:13px;letter-spacing:1px;text-transform:uppercase">Inquiry baru · <strong>${esc(d.category)}</strong></td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#e61e25,#b50346);background-color:#e61e25"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 20px;font-size:20px;color:#003665">${esc(d.subject)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#55657a;width:170px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;font-weight:bold">${esc(v)}</td></tr>`).join('')}
</table>
<div style="margin-top:20px;padding:18px;border-radius:12px;background:#f3f6fa;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(d.message)}</div>
<p style="margin:20px 0 0;font-size:12px;color:#55657a">Dikirim ${esc(when)} WIB melalui formulir kontak bhineka.global. Balas email ini untuk langsung menjawab pengirim.</p>
</td></tr></table></td></tr></table></body></html>`;

  return { text, html };
}

export async function verifyTurnstile(token: string, secret: string | undefined, ip?: string) {
  // Cloudflare's documented always-pass test secret, used only until the real secret is configured.
  if (!secret) console.warn('[contact] TURNSTILE_SECRET_KEY is not set; using the Cloudflare test key (no bot protection).');
  const key = secret || '1x0000000000000000000000000000000AA';
  const body = new URLSearchParams({ secret: key, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const json = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  return json.success === true;
}
