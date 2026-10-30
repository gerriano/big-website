# Website PT Bhineka Inovasi Global (BIG)

Company profile **bhineka.global** — Astro 5 (static) + GSAP untuk motion, Decap CMS untuk pengelolaan konten, dan satu fungsi serverless di Vercel untuk formulir kontak.

## Halaman

| URL | Isi |
| --- | --- |
| `/` | Beranda: hero, angka kunci, tentang singkat, peta distribusi interaktif, brand, kanal, prinsipal, klien |
| `/brand` | Portofolio brand (filter kategori) + prinsipal |
| `/tentang-kami` | Profil, struktur grup, visi & misi, identitas logo, gudang & armada, peta, klien |
| `/kontak` | Form inquiry (captcha Turnstile → email ke info@bhineka.global) + alamat & peta kantor |
| `/admin` | Panel CMS untuk tim konten |

## Menjalankan secara lokal

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check + build produksi
```

## Mengubah konten

Semua konten ada di `src/content/` (JSON) dan bisa diubah lewat **/admin** tanpa menyentuh kode:

- `brands/` — satu file per brand (nama, kategori, prinsipal, deskripsi, foto)
- `principals/` — prinsipal & supplier
- `clients/` — klien per kategori (angka "99 klien" dihitung otomatis)
- `pages/home.json`, `pages/about.json` — teks Beranda & Tentang Kami
- `settings/site.json` — kontak, alamat kantor, kategori dropdown form

Setiap *Publish* di CMS membuat commit ke `main`; Vercel otomatis membangun ulang (±1–2 menit).

## Konfigurasi Vercel (Environment Variables)

Lihat `.env.example`. Isi di **Vercel → Project → Settings → Environment Variables**, lalu *Redeploy*.

| Variabel | Fungsi |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Server email dari tim IT (cPanel). Port 465 → `SMTP_SECURE=true`; port 587 → `false` |
| `MAIL_TO` | Tujuan notifikasi (default `info@bhineka.global`) |
| `MAIL_FROM` | Alamat pengirim (default = `SMTP_USER`) |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Captcha Cloudflare Turnstile (scope **Production**). Tanpa ini, lokal & preview memakai test key yang selalu lolos; **Production menolak semua kiriman form** sampai kunci asli diisi. |
| `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` | Login CMS |

### Membuat kunci Turnstile
1. Cloudflare dashboard (akun gratis; domain **tidak** perlu dipindah ke Cloudflare) → Turnstile → *Add widget*.
2. Hostname: `bhineka.global` (tambah `www.bhineka.global` jika dipakai). Mode widget: **Managed**.
3. Salin *Site key* → `PUBLIC_TURNSTILE_SITE_KEY` dan *Secret key* → `TURNSTILE_SECRET_KEY`, centang environment **Production** saja (preview tetap memakai test key).
4. **Redeploy** — site key tertanam di HTML saat build, jadi tanpa build ulang tidak berubah.
5. Uji: token palsu harus ditolak dengan pesan *Verifikasi keamanan gagal*:

   ```bash
   curl -s -X POST https://bhineka.global/api/contact -F 'cf-turnstile-response=XXXX.DUMMY.TOKEN.XXXX'
   ```

### Membuat GitHub OAuth App (login CMS)
GitHub → Settings → Developer settings → OAuth Apps → *New OAuth App*:
- Homepage URL: `https://<domain-website>`
- Authorization callback URL: `https://<domain-website>/api/callback`

Editor CMS harus punya akun GitHub dengan akses *write* ke repo ini.

## Format email notifikasi

Subjek: `[Kategori Inquiry] Subjek dari pengirim`, contoh `[Kemitraan Prinsipal] Distribusi produk snack`.
*Reply-To* diisi email pengirim, jadi cukup klik **Reply**.

## Catatan teknis

- Peta Indonesia dibuat dari data Natural Earth (`npm run build:map` → `src/data/indonesia-map.json`).
- Logo di `src/data/logo.ts` adalah hasil vektorisasi dari *BIG Logo Playbook 2026*. Jika ada file vektor resmi (SVG/AI), sebaiknya diganti.
- Font: Libre Franklin (pengganti web untuk Franklin Gothic Heavy) + Poppins, di-host sendiri.
- Semua animasi menghormati pengaturan *reduce motion* di perangkat pengguna.
