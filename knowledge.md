# simple_mode: true — 6-month usage target is ~1.000–5.000 visits/bulan but realistic
# concurrent load is single-digit (well under 100 per PRD §6.1); compliance is WCAG
# (accessibility, not data-regulation) + UU PDP baseline only, no PCI-DSS/GDPR-sensitive-
# data/HIPAA-class requirement — neither simple_mode condition is tripped.
---
project: Classmate — Company Profile & Katalog Layanan (classmate-web)
version: 1.0.0
source: prd
last_updated: 2026-08-06
project_shape: fullstack
simple_mode: true
---

## 1. Project Identity
- Name: Classmate — Company Profile & Katalog Layanan (classmate-web)
- Purpose: Website company profile Classmate (art & craft party organizer) — katalog layanan, dokumentasi aktivitas, trust signal, funnel WhatsApp, dwibahasa ID/EN — menggantikan pricelist PDF.
- Primary actors: B2C (pencari paket ulang tahun/art party), B2B (procurement/marketing developer properti, sekolah, brand, venue), Internal (admin ticker)
- Project Shape: fullstack — semua 7 phase (PRD §9 matrix) berlaku; Phase 2 (Domain & Data) ringan — hanya KV, bukan skema relasional; Phase 4 (Integration) minim — tidak ada API pihak ketiga dipanggil live saat runtime
- External API consumers: none

## 2. Tech Stack
- Language: TypeScript 5.x
- Runtime: Cloudflare Workers (V8 isolate, bukan Node.js compat mode)
- Frameworks: Astro 4.x (islands architecture), Tailwind CSS 3.x, React 18 (islands)
- Database: Cloudflare KV — khusus konten ticker. Bukan relational DB.
- Static content (bukan "database"): Astro Content Collections (JSON/YAML) untuk packages, activities, testimonials, clients-venues
- Storage: Cloudflare R2 (bucket `classmate-assets`) — gambar kurasi WebP, <300KB
- Infrastructure: Cloudflare Pages + Pages Functions + R2 + Cloudflare Access — 100% free tier, tanpa biaya sedikit pun
- Container orchestration: none (edge/serverless)
- Key third-party services: Google Drive (arsip foto mentah — tidak diakses live oleh aplikasi)
- Dependency/package manager: `[ASSUMED — belum dinyatakan di PRD]` npm dengan lockfile (`package-lock.json`) committed

## 3. Architecture
- Folder structure:
  ```
  classmate-web/
  ├── src/
  │   ├── content/
  │   │   ├── packages/          # JSON/YAML, field _id + _en
  │   │   ├── activities/         # 38 entri aktivitas & kelas
  │   │   ├── testimonials/       # placeholder terstruktur
  │   │   └── clients-venues/     # daftar logo klien & venue
  │   ├── pages/
  │   │   ├── id/                 # rute default
  │   │   └── en/
  │   ├── components/             # Header, Ticker, Hero, ActivityCard, dst
  │   ├── layouts/
  │   └── styles/tokens.css       # design tokens
  ├── functions/api/
  │   ├── ticker.ts                # GET publik
  │   └── admin/ticker.ts          # POST, di balik Cloudflare Access
  ├── public/img/                  # logo, ikon SVG, favicon
  └── astro.config.mjs
  ```
- Layer responsibilities: Content Collections = data layer (build-time); Components = presentation; Pages Functions = API layer minimal (2 endpoint saja)
- Design patterns: Content Collections sebagai "repository" konten statis; satu handler per endpoint, tanpa layering berlapis
- State management: `[ASSUMED]` React island local state (`useState`) per komponen — tidak ada global state library, tidak ada state lintas-halaman yang perlu di-share
- Data flow: Build-time: Content Collections → Astro static HTML. Runtime (ticker saja): browser → `GET /api/ticker` → Pages Function → KV read → JSON → island render.
- Key architectural decisions:
  1. Astro over Next.js — performa & SEO default lebih kuat untuk situs content-heavy, JS minimal, deploy native ke Cloudflare Pages tanpa adapter.
  2. Cloudflare KV over relational database (D1/Postgres) — satu-satunya data dinamis adalah ≤3 pesan ticker; KV cukup, tetap free tier.
  3. Cloudflare Access over custom auth — gerbang login admin aman tanpa membangun & merawat sistem auth sendiri, tetap gratis (≤50 user).
  4. Content Collections (file-based) over headless CMS — konten paket/aktivitas jarang berubah, lebih aman lewat git (versioning, review) dibanding dependency CMS.
  5. R2 (kurasi) + Google Drive (arsip) over hotlink langsung dari Drive — foto mentah 6–7MB tidak layak tayang langsung; butuh foto teroptimasi tanpa kehilangan arsip asli.

## 4. Code Standards
- Files: kebab-case (`activity-card.astro`)
- Functions: camelCase
- Classes/types: PascalCase
- Formatter: Prettier
- Linter: ESLint + `@typescript-eslint` + `eslint-plugin-astro`
- Testing: Vitest (unit — util & Pages Functions); Playwright (E2E, `[ASSUMED]` Fase 2 — filter aktivitas, klik WA, ganti bahasa)
- Coverage target: 70% pada logic non-UI (util, Pages Functions)
- Test isolation: setiap test setup & teardown state sendiri — khususnya test yang menyentuh KV, wajib pakai mock/namespace terpisah, tidak boleh bergantung pada state test lain
- Error handling: try-catch di tiap Pages Function handler; tidak ada unhandled promise rejection

## 5. API & Data Contracts
- Base URL: `/api/`
- Endpoints: `GET /api/ticker` (publik), `POST /api/admin/ticker` (terproteksi)
- API versioning: tidak ada (`/api/ticker`, bukan `/api/v1/`) — permukaan API terlalu kecil & internal
- Backward-compatibility policy: tidak formal (tidak ada consumer eksternal) — namun perubahan bentuk response `/api/ticker` harus tetap sinkron antara Worker & frontend island dalam repo yang sama
- Rate limiting store: tidak diperlukan — Access membatasi siapa yang POST; GET publik jauh di bawah limit Workers free tier
- Authentication: Cloudflare Access untuk `/api/admin/*` (Access JWT di header `Cf-Access-Jwt-Assertion`, divalidasi via Access public key/JWKS); `/api/ticker` tanpa auth
- Webhook inbound verification: n/a — tidak ada webhook masuk di scope ini
- Response envelope: `{ data, error }`
- Error format: `{ code, message }` — **sengaja tanpa `request_id`**, keputusan eksplisit di PRD §4.4 mengingat skala API sangat kecil (2 endpoint, internal only, tanpa tracing infra)
- Pagination: tidak berlaku (payload ticker selalu ≤3 item)

## 6. UI / UX Constraints
- Design system — warna (peran, bukan dipakai merata sebagai blok besar):
  | Peran | Warna | Hex |
  |---|---|---|
  | Primary/CTA | Folly | `#FF0659` |
  | Secondary/aksen | Byzantine | `#BC22B8` |
  | Tag & ikon aktivitas (terbatas) | Vivid Yellow / Pumpkin / Robin Egg Blue / Kiwi | `#F7E500` `#FF7110` `#00DDC2` `#73D832` |
  | Latar dasar | Ivory hangat | `#FFF9F3` |
  | Permukaan kartu | Putih | `#FFFFFF` |
  | Teks | Ink (near-black hangat) | `#2B1B26` |
  | Teks sekunder | Ink soft | `#6B5A66` |
- Tipografi: **Fredoka** = primary/display (headline, angka besar) — pengganti Bolden Van (lisensi personal-use-only, tidak dipakai). **Baloo 2** = alternate display (dipakai kalau Fredoka kurang pas di konteks tertentu, mis. badge/eyebrow kecil) `[ASSUMED interpretation — developer menjawab "Fredoka Baloo 2" tanpa merinci peran masing-masing, konfirmasi kalau maksudnya beda]`. **Human Sans** = body/UI text (OFL, aman dipakai). Skala: H1 40–56px, H2 28–36px, H3 20–24px, body 16px, caption 14px; mobile ~20% lebih kecil.
- Bentuk & bayangan: radius 12/20/32px (sm/md/lg); shadow `0 8px 30px -8px rgba(43,27,38,.15)` — tidak ada hairline/zero-radius
- Signature element: garis jahitan putus-putus ("stitch line") sebagai divider antar-section, underline hover, border aksen
- Responsive breakpoints: 640/768/1024/1280px, mobile-first
- Accessibility: WCAG 2.1 AA; `:focus-visible` di semua elemen interaktif; kontras teks AA minimum; `prefers-reduced-motion` dihormati (motion dinonaktifkan otomatis); alt text wajib di semua gambar
- Forbidden UI patterns: testimoni placeholder yang terlihat seperti asli tanpa penanda jelas; state/kategori yang hanya dibedakan lewat warna tanpa label teks/ikon; motion tanpa fallback reduced-motion
- Output encoding: Astro auto-escape default — tidak pakai `set:html` dengan konten yang belum disanitasi
- CDN/SRI: Google Fonts via `<link>` standar (risiko rendah, SRI tidak wajib); SRI wajib kalau ada script pihak ketiga lain ditambahkan dari CDN eksternal
- Halaman (routing, per keputusan developer — **Klien & Venue dan S&K terpisah, bukan digabung**):
  - `/` Beranda
  - `/layanan` — katalog paket
  - `/aktivitas` — galeri aktivitas & kelas
  - `/klien-venue` — logo wall klien & venue **saja**
  - `/syarat-ketentuan` — kebijakan pembayaran & komitmen peserta **saja**
  - `/tentang` — profil perusahaan
  - `/kontak`
  - Setiap rute punya versi `/en/...`
- Tone modulation: halaman `/klien-venue` boleh lebih clean/formal (white space lebih lega, grid logo lebih disiplin) — tetap palet warna Classmate, bukan skin terpisah

## 7. Business Logic & Domain Rules

### Data Schema
```
Entity: TickerMessage (item dalam array, disimpan dalam 1 KV key "ticker:messages")
  - id: string — unique per pesan (bukan PRIMARY KEY relasional, berfungsi serupa dalam array)
  - text_id: string, NOT NULL
  - text_en: string, NOT NULL
  - active: boolean, NOT NULL, default: true
  - priority: number, NOT NULL — urutan tampil
  - updated_at: string (ISO 8601) [ASSUMED — audit ringan]
  Foreign keys: tidak berlaku (KV, bukan relasional)
  Indexes: tidak berlaku — seluruh array dibaca sekaligus per request
```
- Key relationships: tidak ada relasi antar-entity (1 entity dinamis)

### Domain Rules & Behavior
- Tier "Activity Only": minimum 10 peserta, harga per peserta (bukan per paket); tidak dapat free transport
- Tier paket lain (25p/50p/100p): harga flat per paket; free transport khusus tier paket
- "Kelas Lainnya" (28 item): minimum 20 peserta — beda dari aktivitas inti (termasuk dalam paket), wajib dibedakan di UI
- Tidak ada satu tier pun yang ditandai "paling populer" — keputusan sengaja, agar klien tetap berdiskusi dan ada ruang negosiasi
- Maksimum 3 pesan ticker aktif tampil bersamaan; tiap pesan wajib versi `text_id` & `text_en`
- Nomor WA terpusat di satu konfigurasi (bukan hardcode berulang): `628992400880`
- Testimoni asli (nama + kota dipublikasikan) **wajib** lewat form consent sebelum publish — bukan izin lisan/WA
- Sensitive data fields: TickerMessage — tidak ada. Testimonial (Content Collection, bukan KV) — `name`, `city` adalah PII, digerbangi consent form di atas
- Delete strategy: TickerMessage tidak ada hard/soft delete — admin toggle `active:false`
- Keys dengan live traffic saat perubahan struktur: `ticker:messages` — perubahan skema JSON harus backward-compatible atau lewat one-shot migration script
- Idempotent operations: `POST /api/admin/ticker` — full overwrite array, aman di-retry
- Multi-entity atomic transactions: tidak berlaku (1 KV key, 1 operasi tulis)
- Versioning aplikasi: `[ASSUMED]` semver ringan di `package.json`

## 8. Environment & Configuration
- Required env vars: `CLASSMATE_KV` (KV namespace binding), `CLASSMATE_ASSETS` (R2 bucket binding)
- Feature flags: none Fase 1; `[ASSUMED]` `ENABLE_ADMIN_PANEL` Fase 2 untuk soft-launch bertahap
- Observability:
  - Logging: Cloudflare Workers Logs (dashboard bawaan)
  - Error tracking: none Fase 1; Sentry free tier opsi Fase 2
  - PII scrubbing: n/a Fase 1 (belum ada error tracking aktif)
  - Metrics: Cloudflare Analytics bawaan + **Cloudflare Web Analytics** `[DECISION NEEDED di PRD, ditutup di sini]` — dipakai untuk mengukur success metric "klik WA/bulan" (PRD §1) karena gratis, tanpa cookie, sesuai constraint 100% free — custom event pada klik tombol WA
  - Alerting: tidak ada
- Health check: single endpoint (non-orchestrated) — `GET /api/health` → `{ status, kv_reachable }`
- Container secret injection: n/a
- Build pipeline: GitHub → Cloudflare Pages, auto-deploy tiap push ke `main`, preview deployment tiap PR
- Multi-environment: dev (`astro dev`/`wrangler dev` lokal) / preview / prod
- Backup: source code GitHub (permanen); KV di-mirror ke JSON di repo tiap admin save; foto asli permanen di Google Drive
- RTO: <1 jam. RPO: ~24 jam
- Rollback: 1-klik bawaan Cloudflare Pages ke deployment sebelumnya
- Canary/staged-rollout: tidak diperlukan (6-month target realistis di bawah 1.000 concurrent)

## 9. Constraints & Anti-patterns
- Harus jalan di Cloudflare Workers runtime — tidak ada Node.js `fs`/`net` native modules di Pages Functions
- Seluruh endpoint API tetap dalam Workers free tier (100.000 request/hari)
- Tidak ada `any` type di TypeScript
- Tidak hardcode nomor WA/harga di banyak tempat — satu sumber konten
- Tidak ada foto mentah (>1MB) langsung dipakai di halaman — wajib lewat pipeline kompresi
- Tidak ada secret tertulis di kode — hanya Worker secret/env
- Tidak ada testimoni placeholder yang terlihat seperti asli tanpa penanda jelas
- Tidak ada endpoint `/api/admin/*` yang bisa diakses tanpa melalui Cloudflare Access
- Tidak ada `console.log` di production build
- CORS `/api/*`: dibatasi origin situs sendiri, tidak wildcard `*`
- HTTP method override: `[ASSUMED]` tidak mempercayai header override method apa pun — default aman standar
- Redirect policy: `[ASSUMED]` tidak ada redirect ke URL dari input user tanpa allowlist (situs ini tidak punya fitur redirect dinamis)
- Webhook policy: n/a — tidak ada webhook masuk di scope ini
- Idempotency policy: lihat §7 — `POST /api/admin/ticker` wajib idempotent (full overwrite)
- Secret-comparison policy: `[ASSUMED]` tidak ada perbandingan secret manual di kode (Access menangani verifikasi) — kalau ada custom check ditambahkan nanti, wajib constant-time comparison
- Input-validation regex policy: `[ASSUMED]` hindari regex kompleks/nested-quantifier pada input admin form (field sederhana: teks pendek, boolean, integer)
- Container secret policy: n/a
- API stability policy: tidak formal (tidak ada consumer eksternal) — Worker & frontend island tetap harus di-deploy sinkron dalam repo yang sama
- Migration locking policy: n/a (KV, bukan relasional) — perubahan struktur `ticker:messages` harus backward-compatible atau one-shot script
- CI/CD secret policy: env var terenkripsi bawaan Cloudflare Pages dashboard, tidak pernah di repo
- Performance constraints: P95 < 300ms untuk `/api/ticker`; Lighthouse Performance ≥90 untuk halaman statis `[ASSUMED]`
- Security hard rules: tidak ada secret di source code; CORS tidak wildcard di non-dev
- Known technical limitations: Cloudflare KV eventual consistency (~60 detik propagasi global) — update ticker mungkin tidak instan di semua edge lokasi; WhatsApp `wa.me` tidak menjamin pesan pre-filled selalu terbuka otomatis di semua device/browser
- Compliance: WCAG 2.1 AA; UU PDP Indonesia baseline (PII minimal — nama+kota testimoni, digerbangi form consent, §7); tidak ada requirement pentest dinyatakan
