---
project: Classmate Indonesia — Company Profile & Activity Catalog Website
version: 1.0.0
source: prd
last_updated: 2026-09-03
project_shape: fullstack
simple_mode: false
external_assets: true
---
# simple_mode: false — PRD §6.1 concurrent load target eksplisit <100, TAPI §6.4 Compliance BUKAN "none" (WCAG 2.1 AA + UU PDP Indonesia baseline dinyatakan eksplisit). Kedua syarat harus true bersamaan; compliance gagal, jadi false.
# external_assets: true — PRD §4.6/§9 + fitur Social Proof Wall & Activity Explorer mereferensikan 38 set foto dokumentasi aktivitas, 29 logo klien/venue, dan font Human Sans (OFL, belum di-upload) — semuanya aset yang tidak bisa di-generate agent. Lihat asset-manifest.md.

## 1. Project Identity
- Nama: Classmate Indonesia — Company Profile & Activity Catalog Website
- Tujuan: situs company profile bilingual (ID/EN) untuk penyelenggara art & craft party anak; katalog aktivitas/paket + social proof, mendorong inquiry via WhatsApp
- Primary users/actors: calon klien B2C (orang tua) & B2B (developer properti, sekolah, venue/hotel, event organizer); admin internal Classmate (kelola ticker pengumuman)
- Project Shape: fullstack (single deployable — static frontend + Cloudflare Pages Functions, bukan microservices)
- Phase applicability (PRD §9): Phase 2 (Domain & Data) tidak berlaku ketat — Database = none, skema kecil TickerMessage dilipat ke Phase 3. Phase 1, 3, 4, 5, 6, 7 semuanya applies.
- External API consumers: none — internal only. Workflow backup terjadwal (GitHub Actions) memanggil endpoint situs sendiri, tetap dihitung internal.

## 2. Tech Stack
- Language & runtime: TypeScript 5.x; Node.js hanya di build time (`astro build`); Cloudflare Workers (V8 isolate) untuk Pages Functions saat runtime
- Framework: Astro 4.x (`output: 'static'`, islands architecture) + React 18 (islands) + Tailwind CSS 3.x
- Database: none — Cloudflare KV dipakai sekadar key-value kecil (≤3 pesan ticker aktif, ≤10 tersimpan), bukan database aplikasi
- Infrastructure: Cloudflare Pages (hosting + CDN) + Cloudflare Pages Functions
- Container orchestration: none (edge/serverless by design)
- Key third-party services: Cloudflare Access (JWT browser login untuk admin manusia + Service Token untuk automasi backup); Cloudflare Web Analytics (cookie-less, custom event klik WA); GitHub Actions (scheduled workflow, backup harian ticker — jalan di repo yang sama, bukan deployable Cloudflare terpisah). Google Drive = arsip foto mentah offline, tidak dipanggil live.
- Webhook providers: none
- Dependency lockfile: npm (`package-lock.json`)

## 3. Architecture
- Folder structure:
  ```
  src/
  ├── data/          # plain typed TS modules (repository build-time) — activities.ts,
  │                  #   testimonials-clients.ts, packages.ts, site-config.ts, ui-strings.ts
  ├── lib/
  │   ├── types.ts   # Activity, LogoEntry, Locale, OptimizedImage
  │   └── media.ts   # build-time image resolver (import.meta.glob + astro:assets getImage())
  ├── assets/        # activities/, logos/{clients,venues}/, hero/
  ├── components/
  │   ├── islands/    # React, client-hydrated (mis. ActivityExplorer.tsx)
  │   ├── sections/    # Astro, per-halaman
  │   └── LogoWall.astro, PackageCard.astro, TestimonialCard.astro
  ├── pages/         # rute ID (default) + en/ mirrored
  ├── layouts/
  └── styles/
  functions/api/
  ├── ticker.ts               # GET, publik
  ├── admin/ticker.ts         # POST, Access JWT
  ├── admin/ticker-export.ts  # GET, Access Service Token (backup)
  └── health.ts                # GET, publik
  public/img/        # logo/favicon situs sendiri saja — tidak pernah R2-backed
  astro.config.mjs    # output: 'static'
  .github/workflows/backup-ticker.yml
  ```
- Layer responsibilities: `src/data/*.ts` = sumber konten statis (repository); `lib/media.ts` = satu-satunya titik resolusi gambar (data file tidak pernah import gambar langsung); `components/islands/` = satu-satunya tempat React dihidrasi client-side; `functions/api/` = satu handler per endpoint, tanpa layering tambahan
- Design patterns: build-time asset resolver (`import.meta.glob` + `getImage()`, dipusatkan di `lib/media.ts`); scheduled-pull untuk backup (GitHub Actions men-*pull* lewat endpoint terproteksi, aplikasi tidak pernah men-*push* keluar)
- State management: tidak ada state management global (Redux/Zustand/dll) — tiap React island mandiri dengan local state (`useState`) saja
- Data flow: Build-time: `src/data/*.ts` → `lib/media.ts` → halaman/komponen Astro → HTML statis + island. Runtime (ticker): browser → `GET /api/ticker` → KV read → `{data, error}`. Admin: Access JWT → `POST /api/admin/ticker` → validasi → overwrite KV. Backup: GitHub Actions (cron harian) → `GET /api/admin/ticker-export` (Access Service Token) → baca KV → commit `backups/ticker-messages.json`.
- Key architectural decisions:
  1. Astro over Next.js — performa & SEO default lebih kuat untuk situs content-heavy, JS minimal, deploy native ke Cloudflare Pages tanpa adapter
  2. Plain TS data modules over headless CMS — konten jarang berubah, lebih aman lewat git versioning tanpa dependency CMS berbayar
  3. **[SUPERSEDED 2026-09]** `src/assets/` + astro:assets (Sharp) over Cloudflare R2 — R2 di-enable dengan billing tapi nol referensi kode; volume gambar riil (puluhan MB) muat wajar sebagai build asset lewat git
  4. GitHub Actions scheduled-pull over Cloudflare Cron Trigger + Worker terpisah — **Cloudflare Pages tidak mendukung Cron Trigger native** (dicek langsung di dokumentasi resmi); GitHub Actions dipilih supaya proyek tetap 1 deployable Cloudflare, tanpa PAT terpisah (`GITHUB_TOKEN` bawaan workflow cukup)
  5. Cloudflare Access Service Token lewat Access Application terpisah dari `/admin` — least privilege; kalau token backup bocor, blast radius-nya cuma baca-saja endpoint export, bukan kemampuan menulis ticker

## 4. Code Standards
- Naming — files: kebab-case; PascalCase khusus komponen Astro/React
- Naming — functions: camelCase
- Naming — classes/types: PascalCase
- Function structure: try-catch di tiap Pages Function handler boundary; tidak ada unhandled promise rejection
- Formatter: Prettier — install + config di Phase 1
- Linter: ESLint + `@typescript-eslint` + `eslint-plugin-astro` — install + config di Phase 1
- Testing framework: Vitest (unit — util & Pages Functions) + Playwright (E2E) — tooling install + config dasar di Phase 1; penulisan unit test progresif di Phase 3, suite E2E lengkap dituntaskan di Phase 6
- Test coverage target: 70% pada logic non-UI (util, Pages Functions)
- Docstring/comment requirement: satu baris tujuan di tiap exported function, class, dan method — hidup di sebelah kode yang dideskripsikan, bukan diduplikasi ke dokumen ini

## 5. API & Data Contracts
- Base URL pattern: `/api/`
- API versioning strategy: none (`/api/ticker`, bukan `/api/v1/`) — permukaan API terlalu kecil & 100% internal
- Backward compatibility policy: tidak formal (tanpa consumer eksternal), tapi Worker & frontend island wajib deploy sinkron dalam repo yang sama
- Rate limiting store: tidak diperlukan — Access membatasi siapa yang bisa POST; GET publik jauh di bawah limit Workers free tier
- Authentication method: Cloudflare Access, dua mode — (a) JWT browser (header `Cf-Access-Jwt-Assertion`) untuk admin manusia; (b) Service Token (header `CF-Access-Client-Id` + `CF-Access-Client-Secret`) untuk automasi backup. Keduanya diverifikasi Access di edge, tidak ada verifikasi manual di kode aplikasi.
- Webhook inbound verification: n/a — tidak ada webhook masuk di scope ini
- Endpoint:
  | Method | Path | Auth | Deskripsi |
  |---|---|---|---|
  | GET | `/api/ticker` | none (publik) | Baca pesan ticker aktif |
  | POST | `/api/admin/ticker` | Access JWT (browser) | Overwrite penuh array ticker |
  | GET | `/api/admin/ticker-export` | Access Service Token | Baca raw KV value untuk backup |
  | GET | `/api/health` | none (publik) | `{ status, kv_reachable }` |
- KV value shape (`ticker:messages` key):
  ```
  TickerMessage[]
    - id: string
    - text_id: string, NOT NULL
    - text_en: string, NOT NULL
    - active: boolean, NOT NULL, default: true
    - priority: number, NOT NULL
    - updated_at: string (ISO 8601)
  ```
- Response envelope: `{ data, error }`
- Error response format: `{ code, message }` — **sengaja TANPA `request_id`** (keputusan eksplisit, skala API terlalu kecil untuk infra tracing)
- Pagination: tidak berlaku (payload ticker selalu ≤10 item)

## 6. UI / UX Constraints
- Component library: Tailwind CSS 3.x custom theme, tanpa UI library eksternal (komponen custom Astro/React)

### Design Tokens
- **Color palette:** primary/CTA **Folly** `#FF0659`; secondary/aksen **Byzantine** `#BC22B8`; aksen terbatas (tag & ikon aktivitas saja): Vivid Yellow `#F7E500`, Pumpkin `#FF7110`, Robin Egg Blue/Teal `#00DDC2`, Kiwi `#73D832`; latar dasar Ivory `#FFF9F3`; kartu Putih `#FFFFFF`; teks Ink `#2B1B26`; teks sekunder Ink Soft `#6B5A66`. Warna dipakai berbasis peran, bukan blok besar merata.
- **Typography:** **Fredoka** = primary/display (headline, angka besar). **Baloo 2** = alternate display, khusus badge/eyebrow kecil saja. **Human Sans** (OFL) = body/UI text — file belum di-upload, fallback `system-ui`. Skala: H1 40–56px / H2 28–36px / H3 20–24px / body 16px / caption 14px, ~20% lebih kecil di mobile.
- **Brand voice / tone:** tidak didefinisikan sebagai kata sifat resmi (keputusan eksplisit) — ikuti sinyal UI existing: playful & rounded, tetap kredibel untuk audiens B2B.
- **Visual direction:** playful & rounded — radius 12/20/32px (sm/md/lg), shadow `0 8px 30px -8px rgba(43,27,38,.15)`, tanpa hairline/zero-radius. Signature element: garis jahitan putus-putus ("stitch line") sebagai divider. Tone modulation: halaman `/klien-venue` lebih clean/formal (grid logo lebih disiplin), palet warna tetap sama.

- Accessibility requirements: WCAG 2.1 AA
- Forbidden UI patterns: tidak ada state/kategori yang hanya dibedakan lewat warna tanpa label teks/ikon; tidak ada motion tanpa fallback `prefers-reduced-motion`; tidak ada testimoni placeholder yang terlihat seperti asli tanpa penanda jelas
- External asset requirements: lihat `asset-manifest.md`

## 7. Business Logic & Domain Rules

### Domain Rules & Behavior
- Tier "Activity Only": minimum 10 peserta, harga per peserta, tanpa free transport
- Tier paket 25/50/100 peserta: harga flat per paket, dapat free transport
- "Kelas Lainnya" (28 aktivitas, minimum 20 peserta) wajib dibedakan visual dari 10 aktivitas inti (sudah termasuk paket)
- Ticker: maksimum 10 pesan boleh **tersimpan**, maksimum 3 pesan **aktif** boleh tampil bersamaan (dibedakan — validasi jumlah aktif di sisi consumer/widget, bukan di payload POST); tiap pesan wajib `text_id` & `text_en`
- Validasi input: payload `POST /api/admin/ticker` array 1–10 item, tiap item type-checked terhadap skema TickerMessage
- Ticker message state: toggle `active`/`inactive`, bukan hard-delete
- PII: `name` + `city` pada testimoni asli wajib digerbangi consent form sebelum publish (bukan izin lisan/WA) — bukan kasus "encryption at rest" karena bukan data di database, melainkan konten statis git yang butuh consent sebelum di-commit
- Operasi idempotent: `POST /api/admin/ticker` (full overwrite, aman di-retry); workflow backup (no-op commit kalau tidak ada perubahan sejak run terakhir)
- Backup: hanya snapshot **terkini** disimpan (file di-overwrite tiap run), bukan arsip historis per-tanggal
- Application versioning strategy: semver ringan di `package.json`

## 8. Environment & Configuration
- Required env vars (Cloudflare Pages): `CLASSMATE_KV` (KV namespace binding) — tidak ada lagi `CLASSMATE_ASSETS`/R2
- Required secrets (GitHub Actions repository secrets, terpisah dari Cloudflare): `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` (dari Access Service Token khusus endpoint export)
- Feature flags: tidak ada di Fase 1
- Observability — logging: Cloudflare Pages Functions real-time log bawaan, tidak ada structured JSON logger, tidak ada agregasi eksternal
- Observability — error tracking: none Fase 1; Sentry free tier = opsi Fase 2, belum diimplementasikan
- Observability — metrics: Cloudflare Web Analytics (custom event klik WA) + Cloudflare Analytics bawaan
- Observability — alerting: tidak ada untuk situs utama; kegagalan workflow backup cukup notifikasi email bawaan GitHub Actions ke pemilik repo, tidak ada channel tambahan (Slack, dll.)
- Health check endpoint: single, non-orchestrated — `GET /api/health` → `{ status, kv_reachable }`
- Build pipeline: Cloudflare Pages native Git integration — auto-deploy tiap push ke `main`, preview deployment tiap PR; **jalur terpisah** dari GitHub Actions scheduled workflow (backup harian) — dua pipeline independen, kegagalan satu tidak mem-block yang lain
- Multi-environment: dev (`astro dev`/`wrangler dev` lokal) / preview (tiap PR) / prod
- Backup strategy: ticker KV di-backup otomatis harian, cron `0 19 * * *` UTC = 02:00 WIB, lewat GitHub Actions → `GET /api/admin/ticker-export` → commit `backups/ticker-messages.json`. Retensi: file tunggal, di-overwrite (bukan arsip historis). Kode & konten (termasuk gambar) ter-versioning penuh di git; foto mentah permanen di Google Drive.
- RTO: <1 jam (rollback 1-klik Cloudflare Pages)
- RPO: ~24 jam (cocok dengan kadensi backup harian)
- Rollback strategy: 1-klik rollback bawaan Cloudflare Pages ke deployment sebelumnya
- Canary/staged-rollout: tidak diperlukan (6-month target jauh di bawah 1.000 concurrent)

## 9. Constraints & Anti-patterns
- Tidak ada tipe `any` di TypeScript
- Tidak hardcode nomor WA/harga di banyak tempat — satu sumber konfigurasi (`site-config.ts`)
- Tidak ada foto mentah (>1–2MB) langsung dipakai di halaman — wajib lewat pipeline `astro:assets`
- Tidak ada secret tertulis di kode — hanya env/binding Cloudflare & GitHub Actions secrets
- Tidak ada `console.log` di production build
- `CF_ACCESS_CLIENT_SECRET` tidak boleh muncul di log workflow atau commit message
- CORS `/api/*` dibatasi origin situs sendiri, tidak wildcard `*` di non-dev
- Redirect policy: tidak ada redirect ke URL hasil input pengguna mentah tanpa allowlist (kebijakan umum, belum ada kasus konkret di scope saat ini)
- Webhook policy: n/a — tidak ada webhook masuk
- Idempotency policy: endpoint/operasi yang bisa di-retry (`POST /api/admin/ticker`, backup workflow) wajib idempotent — lihat §7
- Secret-comparison policy: n/a — seluruh verifikasi secret (JWT & Service Token) ditangani Cloudflare Access di edge, tidak ada perbandingan secret manual di kode aplikasi
- Input-validation regex policy: tidak ada regex kompleks di scope saat ini (validasi payload ticker berbasis type-check sederhana); kalau ditambah nanti, hindari pola nested-quantifier yang rentan ReDoS
- API stability policy: tidak formal (tanpa consumer eksternal), tapi tidak boleh ada breaking change ke `/api/ticker` tanpa mengecek widget consumer-nya sendiri, karena Worker & frontend deploy dari repo yang sama
- CI/CD secret policy: env var Cloudflare Pages terenkripsi bawaan dashboard, tidak pernah masuk repo; GitHub Actions secrets otomatis di-mask di log run
- Performance constraints: P95 < 300ms untuk `/api/ticker` & `/api/health`; Lighthouse Performance ≥90 untuk halaman statis
- Security hard rules: tidak ada secret di source code; CORS tidak boleh wildcard `*` di non-dev; Access Service Token untuk `/api/admin/ticker-export` wajib lewat Access Application terpisah dari `/admin` (least privilege) — policy-nya hanya "Service Auth", tanpa opsi login email/Google
- Known technical limitations: Cloudflare KV eventual consistency (~60 detik propagasi global); WhatsApp `wa.me` tidak menjamin pesan pre-filled selalu terbuka otomatis di semua device; **Cloudflare Pages tidak mendukung Cron Trigger native** (dicek langsung, itu sebabnya backup lewat GitHub Actions, bukan Worker cron internal)
- Compliance requirements: WCAG 2.1 AA; UU PDP Indonesia baseline (PII minimal, consent-gated); tidak ada PCI-DSS/GDPR/HIPAA; belum ada requirement pentest dinyatakan
- Missing-asset fallback policy: tiap komponen yang mereferensikan aset human-supplied (foto aktivitas, logo klien/venue, font Human Sans) wajib menampilkan fallback yang bersih — wordmark teks / placeholder "dokumentasi menyusul" / fallback `system-ui` — tidak pernah gambar rusak, layout patah, atau build gagal, sampai aset asli tersedia. Lihat `asset-manifest.md`.

### Sensitive / High-Blast-Radius Code
- `POST` handler di `functions/api/admin/ticker.ts` — full overwrite seluruh pesan ticker; payload yang salah/tidak lengkap menggantikan semua pesan existing tanpa safety-net partial-update
- `activityImages()` / `clientLogo()` / `venueLogo()` di `src/lib/media.ts` — kesalahan penamaan file (tidak cocok konvensi `activity-{slug}-N.ext` / `client-{slug}.ext`) gagal secara diam-diam (mengembalikan array/`null` kosong, bukan error) — foto/logo yang salah nama akan hilang tanpa pesan kesalahan apa pun
