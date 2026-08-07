---
doc_id: PRD-CLASSMATE-WEB-001
version: 1.0.0
status: draft
created: 2026-08-05
flow_compatibility: vibe-coding-v1.7
project_shape: fullstack
---

# Classmate — Company Profile & Katalog Layanan — Product Requirements Document

> **Injection safety check:** brief di-scan untuk pola `IGNORE`/`OVERRIDE`/`SYSTEM:`/`[INST]`/"forget your instructions" — bersih, tidak ada [INJECTION RISK] terdeteksi.
>
> **Mode Detection:** Project Shape ✓ · Project identity ✓ · Tech stack ✓ · Feature list ✓ (7, min. 3) · Deployment target ✓ · Constraints ✓ → **0 MISSING → Enrichment Mode.** PRD digenerate langsung; gap ditandai `[ASSUMED]` atau `[DECISION NEEDED]` di tempat masing-masing, bukan menahan seluruh dokumen.

---

## 1. Executive Summary
- **Project Shape:** fullstack
- **Problem:** Classmate saat ini bergantung pada pricelist PDF statis untuk informasi layanan & closing — sulit di-update, tidak SEO-friendly, tidak dwibahasa, dan lemah membangun trust signal untuk klien B2B.
- **Solution:** Website company profile (Astro + Cloudflare, 100% free tier) dengan katalog layanan terstruktur, galeri aktivitas terdokumentasi, trust signal klien/venue, dan funnel konversi ke WhatsApp, dwibahasa ID/EN.
- **Success metric:** `[DECISION NEEDED]` — belum ada target terukur eksplisit dari developer. Diusulkan sementara: **jumlah klik CTA WhatsApp/bulan** sebagai proxy utama (funnel memang berakhir di WA, bukan checkout di web) — konfirmasi atau ganti sebelum Fase 1 selesai.
- **MVP deadline:** not specified

## 2. Users & Context
- **Primary users:**
  - B2C — orang tua/individu pencari paket ulang tahun & art party anak/dewasa
  - B2B — tim marketing/procurement developer properti, sekolah, brand, venue
  - Internal — admin Classmate yang mengelola konten running header
- **User goal:** B2C closing paket lewat WA dalam ≤3 klik dari Beranda; B2B menilai kredibilitas Classmate lewat halaman Klien & Venue sebelum menghubungi.
- **Current pain:** PDF sulit di-share/update, tidak bisa diindeks Google, tidak dwibahasa, tidak ada dokumentasi visual per aktivitas.
- **Environment:** Web browser, mobile-first (traffic utama diperkirakan dari Instagram & pencarian lokal).
- **External API consumers:** none — internal only.

## 3. Scope

### 3.1 In-Scope Features

| Feature | Priority | Description |
|---|---|---|
| Katalog Layanan & Harga | P0 | 4 tier paket (25p/50p/100p Full Day/Activity Only) + 10 aktivitas inti + 28 kelas lainnya + add-on |
| Aktivitas Kami (galeri + dokumentasi) | P0 (struktur) / P1 (foto asli R2 penuh) | Grid aktivitas filterable, modal detail + dokumentasi foto |
| Running Header Ticker | P0 (versi statis) / P1 (versi KV+admin dinamis) | Bar promo/tema bulan/best-seller di atas nav |
| WhatsApp Conversion Funnel | P0 | Floating button + CTA kontekstual per paket/aktivitas |
| Dwibahasa ID/EN + switcher | P0 | Semua halaman, satu sumber data per entitas |
| Testimoni | P0 (struktur) / P2 (kutipan asli) | Kartu rating+kutipan+nama+event, placeholder ditandai jelas |
| Trust Signal Klien & Venue + S&K | P1 | Logo wall + kebijakan pembayaran/komitmen peserta |

Priority: P0 = must-have MVP / P1 = penting, menyusul / P2 = nice-to-have

### 3.2 Out of Scope (explicit)
- Payment gateway / booking online dengan pembayaran langsung (closing tetap manual via WhatsApp)
- Aplikasi mobile terpisah
- CMS penuh/headless (admin panel sengaja ringan, khusus ticker)
- Multi-tenant / white-label untuk bisnis lain

### 3.3 Future Considerations
- Vektor SVG penuh untuk logo (trace manual, presisi untuk favicon/billboard-size)
- Google Analytics/Meta Pixel + cookie consent notice (belum diperlukan tanpa tracking pihak ketiga)
- Blog/konten SEO (artikel tips parenting/event) untuk organic search
- Video testimoni, multi-role admin, analytics dashboard internal

## 4. Technical Specification

### 4.1 Tech Stack
- **Language & Runtime:** TypeScript 5.x, Cloudflare Workers runtime (V8 isolate, bukan Node.js compat mode)
- **Framework:** Astro 4.x (islands architecture) + Tailwind CSS 3.x; React 18 untuk island interaktif
- **Database:** Cloudflare KV — **hanya** untuk konten ticker (dan metadata ringan Fase 2 mendatang). Konten paket/aktivitas/testimoni/klien-venue **bukan** "database" — disimpan sebagai Astro Content Collections (file JSON/YAML di repo, di-build jadi statis). Lihat pemisahan detail di §4.5.
- **ORM / Query builder:** tidak berlaku (KV diakses langsung lewat binding, bukan ORM)
- **Cache:** tidak ada layer cache terpisah — CDN edge caching bawaan Cloudflare Pages sudah cukup
- **Infrastructure:** Cloudflare Pages (hosting statis) + Cloudflare Pages Functions (`/functions`, dua endpoint) + Cloudflare R2 (object storage gambar) + Cloudflare Access (gerbang admin) — seluruhnya free tier
- **Container orchestration:** tidak berlaku (edge/serverless, bukan container)
- **Key third-party services:** Google Drive (arsip foto mentah — **tidak** diakses live oleh aplikasi, murni arsip manual)
- **Webhook providers:** none
- **Frontend framework:** Astro + React islands (sudah disebut di atas)

### 4.2 Architecture
- **Pattern:** Static-first / Islands Architecture, dengan edge functions minimal (bukan MVC/hexagonal tradisional — mayoritas aplikasi statis)
- **Module structure:**
  ```
  classmate-web/
  ├── src/
  │   ├── content/
  │   │   ├── packages/          # data paket harga (JSON/YAML, field _id + _en)
  │   │   ├── activities/         # 38 entri aktivitas & kelas
  │   │   ├── testimonials/       # placeholder terstruktur
  │   │   └── clients-venues/     # daftar logo klien & venue
  │   ├── pages/
  │   │   ├── id/                 # rute default
  │   │   └── en/
  │   ├── components/             # Header, Ticker, Hero, ActivityCard, dst
  │   ├── layouts/
  │   └── styles/tokens.css       # design tokens
  ├── functions/
  │   └── api/
  │       ├── ticker.ts            # GET publik
  │       └── admin/ticker.ts      # POST, di balik Cloudflare Access
  ├── public/img/                  # logo, ikon SVG, favicon
  └── astro.config.mjs
  ```
- **Key design patterns:** Content Collections sebagai "repository" konten statis; handler tunggal per endpoint di Pages Functions (tidak perlu layering berlapis untuk 2 endpoint)
- **Data flow:** Build-time: Content Collections → Astro static HTML. Runtime (khusus ticker): browser → `GET /api/ticker` → Pages Function → KV read → JSON → island render.
- **Key architectural decisions:**
  1. **Astro over Next.js** — performa & SEO default lebih kuat untuk situs content-heavy dengan JS minimal, deploy native ke Cloudflare Pages tanpa adapter tambahan.
  2. **Cloudflare KV over relational database (D1/Postgres)** — satu-satunya data dinamis adalah ≤3 pesan ticker; KV cukup, tetap dalam free tier, tanpa overhead skema relasional.
  3. **Cloudflare Access over custom auth** — admin panel butuh gerbang login aman tanpa menulis & merawat sistem auth sendiri, tetap gratis (≤50 user).
  4. **Content Collections (file-based) over headless CMS** — konten paket/aktivitas jarang berubah, lebih aman dikelola lewat git (versioning, review) dibanding menambah dependency CMS.
  5. **R2 (kurasi) + Google Drive (arsip) over hotlink langsung dari Drive** — foto mentah 6–7MB tidak layak tayang langsung; aplikasi butuh foto teroptimasi tanpa kehilangan arsip asli.

### 4.3 Code Standards
- **Naming — files:** kebab-case (mis. `activity-card.astro`)
- **Naming — functions:** camelCase
- **Naming — classes/types:** PascalCase
- **Formatter:** Prettier
- **Linter:** ESLint + `@typescript-eslint` + `eslint-plugin-astro`
- **Testing framework:** Vitest (unit — util & Pages Functions); Playwright (E2E, `[ASSUMED]` Fase 2, untuk flow kritis: filter aktivitas, klik WA, ganti bahasa)
- **Test coverage target:** 70% untuk logic non-UI (util, Pages Functions) — target moderat karena mayoritas kode adalah markup/konten statis
- **Error handling:** try-catch di tiap Pages Function handler; response error terstruktur (§4.4); tidak ada unhandled promise rejection

### 4.4 API Design
- **API type:** REST, sangat minimal (2 endpoint)
- **Base URL pattern:** `/api/`
- **Authentication method:** Cloudflare Access untuk `/api/admin/*` (Access JWT di header `Cf-Access-Jwt-Assertion`, divalidasi via Access public key/JWKS); `/api/ticker` publik, tanpa auth
- **Response envelope:** `{ data, error }`
- **Error format:** `{ code, message }` — sederhana, skala kecil, tidak perlu `request_id`/tracing penuh
- **Pagination:** tidak berlaku (payload ticker selalu ≤3 item)
- **API versioning strategy:** tidak ada (`/api/ticker`, bukan `/api/v1/ticker`) — permukaan API terlalu kecil & internal
- **Backward compatibility policy:** tidak berlaku (tidak ada konsumen eksternal)
- **Rate limiting store:** tidak diperlukan — Access sudah membatasi siapa yang bisa POST; GET publik jauh di bawah limit Workers free tier
- **Webhook inbound verification:** tidak ada webhook masuk di scope ini

### 4.5 Data Model

> Catatan penting: bagian ini **hanya** mencakup data yang benar-benar dinamis/live (KV). Konten paket, aktivitas, testimoni, dan klien-venue adalah **Content Collections statis** (file JSON/YAML di-build ke HTML) — bukan "database" dalam pengertian runtime, dan sengaja tidak dimodelkan sebagai entity di sini. Skema Content Collections (≈4 koleksi, ~38+ entri aktivitas) direkomendasikan didokumentasikan terpisah di `knowledge.md` sesuai panduan §7 Data Schema template ini — schema size di sini kecil dan tunggal.

```
Entity: TickerMessage (item dalam array, disimpan dalam 1 KV key "ticker:messages")
  - id: string — unique per pesan (bukan PRIMARY KEY relasional, berfungsi serupa dalam array)
  - text_id: string, NOT NULL
  - text_en: string, NOT NULL
  - active: boolean, NOT NULL, default: true
  - priority: number, NOT NULL — urutan tampil
  - updated_at: string (ISO 8601) [ASSUMED — untuk audit ringan, belum eksplisit diminta]
  Foreign keys: tidak berlaku (KV, bukan relasional)
  Indexes: tidak berlaku — seluruh array dibaca sekaligus per request (ukuran kecil, ≤10 item wajar)
```

- **Key relationships (summary):** tidak ada relasi antar-entity (hanya 1 entity dinamis)
- **Storage strategy:** key-value tunggal (array kecil dalam 1 key), bukan document store per-item
- **Sensitive fields:** tidak ada (seluruh teks publik)
- **Delete strategy:** tidak ada hard/soft delete formal — admin toggle `active:false` untuk "menyembunyikan" pesan
- **Data retention:** tidak berlaku (data kecil, tanpa retensi otomatis)
- **Tables/keys expected to carry live production traffic during migrations:** `ticker:messages` — bukan migrasi tradisional (KV), tapi perubahan struktur JSON harus backward-compatible atau lewat one-shot migration script
- **Schema size:** 1 entity dinamis (sangat kecil). Content Collections (statis) di luar cakupan bagian ini — lihat `knowledge.md` `[DECISION NEEDED: belum dibuat]`.

## 5. Feature Specifications

### Feature: Katalog Layanan & Harga
- **User story:** Sebagai calon klien, saya ingin melihat semua paket & harga secara jelas, sehingga saya bisa membandingkan tanpa perlu chat dulu.
- **Acceptance criteria:**
  - [ ] 4 tier (25p/50p/100p Full Day/Activity Only) tampil dengan harga, durasi, cakupan
  - [ ] Setiap tier punya CTA WA dengan pesan pre-filled sesuai tier
  - [ ] Data harga bersumber dari 1 file konten, bukan hardcode di komponen
- **Business rules:** Tier "Activity Only" minimum 10 peserta, harga per peserta (bukan per paket); tier lain harga flat per paket; free transport hanya untuk tier paket (bukan Activity Only), sesuai pricelist 2026.
- **UI notes:** Kartu perbandingan side-by-side desktop, stack vertikal mobile. `[DECISION NEEDED]`: tier mana yang ditonjolkan sebagai "paling populer" (kalau ada).
- **Priority:** P0

### Feature: Aktivitas Kami (Galeri + Dokumentasi)
- **User story:** Sebagai calon klien, saya ingin melihat aktivitas yang tersedia beserta dokumentasi hasilnya, sehingga saya yakin sebelum booking.
- **Acceptance criteria:**
  - [ ] Grid menampilkan 10 aktivitas inti + 28 kelas lainnya, filterable (tab "Aktivitas Inti"/"Kelas Lainnya")
  - [ ] Klik kartu membuka modal: deskripsi + foto (placeholder bertanda jelas di Fase 1, foto asli R2 di Fase 2)
  - [ ] Setiap modal punya link "Lihat dokumentasi lengkap" ke folder Google Drive terkait
- **Business rules:** Kelas Lainnya (28 item) minimum 20 peserta — beda dari aktivitas inti (termasuk dalam paket); harus dibedakan jelas di UI.
- **UI notes:** Lightbox/carousel untuk multi-foto per aktivitas.
- **Priority:** P0 (struktur) / P1 (foto asli penuh)

### Feature: Running Header Ticker (CMS-lite)
- **User story:** Sebagai admin Classmate, saya ingin update pesan promo/tema bulan/best-seller tanpa minta bantuan developer, sehingga informasi selalu segar.
- **Acceptance criteria:**
  - [ ] Fase 1: 3 pesan hardcoded, tampil rotasi di bar atas nav
  - [ ] Fase 2: admin login (Cloudflare Access) → edit 3 slot pesan (ID+EN) + toggle aktif → simpan → berubah live tanpa redeploy
- **Business rules:** Maksimum 3 pesan aktif tampil sekaligus; tiap pesan wajib versi ID & EN.
- **UI notes:** Auto-advance ~4 detik, tanpa tombol dismiss.
- **Priority:** P0 (struktur+statis) / P1 (dinamis KV+admin)

### Feature: WhatsApp Conversion Funnel
- **User story:** Sebagai calon klien di halaman manapun, saya ingin tombol WA yang selalu terlihat dengan pesan sesuai konteks, sehingga saya tidak perlu mengetik ulang.
- **Acceptance criteria:**
  - [ ] Floating WA button persisten di semua halaman (mobile & desktop)
  - [ ] Pesan pre-filled berbeda per konteks (paket/aktivitas yang dilihat/general)
  - [ ] Nomor WA terpusat di satu konfigurasi, tidak hardcode berulang
- **Business rules:** Nomor resmi 0899-240-0880 (format wa.me: `628992400880`).
- **UI notes:** Posisi pojok bawah kanan (pola respatieo.com), ikon WhatsApp standar.
- **Priority:** P0

### Feature: Dwibahasa ID/EN + Switcher
- **User story:** Sebagai klien B2B internasional/venue berbahasa Inggris, saya ingin membaca situs dalam Bahasa Inggris, sehingga saya paham layanan tanpa hambatan bahasa.
- **Acceptance criteria:**
  - [ ] Semua halaman punya versi `/id/...` dan `/en/...`
  - [ ] Switcher di header mempertahankan halaman yang sama saat pindah bahasa
  - [ ] Bahasa default: Indonesia
- **Business rules:** Satu file konten per entitas dengan field `_id`/`_en` berdampingan — mencegah drift antar bahasa.
- **UI notes:** Switcher teks "ID/EN" `[ASSUMED lebih aman secara visual daripada ikon bendera yang bisa ambigu secara politis/budaya]`.
- **Priority:** P0

### Feature: Testimoni
- **User story:** Sebagai calon klien yang ragu, saya ingin membaca pengalaman klien lain, sehingga saya lebih percaya diri untuk booking.
- **Acceptance criteria:**
  - [ ] Struktur kartu (rating, kutipan, nama, jenis event, kota/tahun) siap pakai
  - [ ] Konten awal placeholder yang **jelas ditandai**, tidak terlihat seperti testimoni asli
  - [ ] Mudah diganti lewat 1 file konten begitu kutipan asli tersedia
- **Business rules:** Tidak boleh publish placeholder yang terlihat seperti testimoni sungguhan tanpa penanda — risiko kredibilitas.
- **UI notes:** Grid/carousel 3 kartu di Beranda.
- **Priority:** P0 (struktur) / P2 (isi asli)

### Feature: Trust Signal Klien & Venue + S&K
- **User story:** Sebagai tim B2B, saya ingin melihat klien/venue yang sudah bekerja sama beserta ketentuan kerja samanya, sehingga saya bisa menilai kredibilitas sebelum menghubungi.
- **Acceptance criteria:**
  - [ ] Grid logo Klien Korporat & Venue Partner tampil terpisah
  - [ ] Bagian S&K memuat kebijakan pembayaran & komitmen peserta
  - [ ] CTA WA di bagian bawah halaman
- **Business rules:** Logo tanpa nama teks (self-explanatory, mengikuti pola referensi respatieo.com).
- **UI notes:** Tone lebih clean/formal dibanding halaman lain.
- **Priority:** P1

## 6. Non-Functional Requirements

### 6.1 Performance & Scale
- Response time target: P95 < 300ms untuk `/api/ticker` (Cloudflare edge — realistis jauh lebih cepat); Lighthouse Performance ≥90 untuk halaman statis `[ASSUMED sebagai target kualitas premium]`
- Concurrent users / usage volume (initial): puluhan/hari
- 6-month target: `[ASSUMED]` ~1.000–5.000 kunjungan/bulan (traffic IG + pencarian lokal skala UMKM); **concurrent** users pada saat bersamaan realistis satu digit — di bawah 100, sehingga Simple Mode kemungkinan berlaku (lihat §6.4 untuk syarat compliance)

### 6.2 Security
- Auth standard: Cloudflare Access untuk admin; tidak ada auth user-facing publik (situs full publik, tanpa akun customer)
- JWT algorithm: ditangani Cloudflare Access — tidak diimplementasikan/di-pin manual
- Password hashing: tidak berlaku (Access pakai email OTP, bukan password yang dikelola sendiri)
- PII handling: testimoni asli (Fase 2) memuat nama & kota — `[DECISION NEEDED]` mekanisme consent dari pemberi testimoni sebelum publish belum dibahas. Tidak ada form pengumpul PII di scope ini (WA click-to-chat tidak menyimpan data di server Classmate)
- Error tracking PII policy: tidak berlaku Fase 1 (belum pakai Sentry)
- Session: tidak berlaku sisi publik; sesi admin dikelola Cloudflare Access
- Brute force protection: ditangani Cloudflare Access
- Secret rotation strategy: Cloudflare API token (KV/R2 write dari Worker) disimpan sebagai Worker secret, rotatable via `wrangler secret put`

### 6.3 Scalability
- Growth expectation: `[ASSUMED]` wajar skala UMKM, tanpa proyeksi 10x eksplisit
- Scaling strategy: serverless auto-scale (Cloudflare edge network, bawaan)
- Caching: CDN edge caching bawaan untuk aset statis; `/api/ticker` diberi cache header pendek (`[ASSUMED]` ~60 detik) untuk kurangi baca KV berulang tanpa membuat update terasa lambat
- DB scaling: tidak berlaku (KV terdistribusi global by design)

### 6.4 Compliance
- Standards: WCAG 2.1 AA (fokus visible, kontras, `prefers-reduced-motion`)
- Regulations: UU PDP Indonesia berlaku ringan — PII minimal (hanya nama/kota di testimoni asli, lihat §6.2). Tidak ada form pengumpul data pribadi di scope ini. `[DECISION NEEDED]`: kalau nanti ditambah Analytics/Pixel, perlu cookie consent notice — dicatat di §3.3 Future Considerations.

### 6.5 Observability
- **Logging:** Cloudflare Workers Logs (dashboard bawaan)
- **Log levels:** `[ASSUMED]` ERROR di production, DEBUG hanya saat `wrangler dev` lokal
- **Error tracking / crash reporting:** none di Fase 1 (menjaga 100% gratis); Sentry free tier sebagai opsi Fase 2
- **Metrics:** Cloudflare Analytics bawaan (tidak perlu Prometheus/Datadog untuk skala ini)
- **Alerting:** tidak ada alerting otomatis — traffic & risiko rendah untuk situs company profile
- **Health endpoints:** `[ASSUMED, non-orchestrated]` `GET /api/health` → `{ status, kv_reachable }` — sederhana, opsional Fase 1

## 7. Environment & Configuration
- **Environments:** dev (`astro dev` / `wrangler dev` lokal), preview (Cloudflare Pages preview per PR), prod
- **Required env vars (names only):** `CLASSMATE_KV` (KV namespace binding), `CLASSMATE_ASSETS` (R2 bucket binding) — tidak ada API key eksternal lain di scope ini
- **Feature flags:** none di Fase 1; `[ASSUMED opsional Fase 2]` `ENABLE_ADMIN_PANEL` untuk soft-launch admin panel bertahap
- **CI/CD:** GitHub → Cloudflare Pages (build otomatis tiap push ke `main`, preview deployment tiap PR)
- **CI secret masking:** bawaan Cloudflare Pages (env var terenkripsi di dashboard)
- **Container secret handling:** tidak berlaku (tanpa container)
- **Deployment command:** `wrangler pages deploy` (otomatis via integrasi GitHub; manual sebagai fallback)
- **Application versioning strategy:** `[ASSUMED]` semver ringan di `package.json`, tidak kritis untuk situs marketing
- **Version tag/build format:** tidak wajib tag ketat — commit SHA Cloudflare Pages sudah cukup
- **Release trigger:** auto-deploy saat merge ke `main`
- **Backup strategy:** source code GitHub; KV di-mirror ke JSON di repo tiap admin save; foto asli permanen di Google Drive
- **Backup retention:** kode: selamanya (git history); mirror KV JSON: `[ASSUMED]` folder `backups/` di repo, tanpa rotasi otomatis di skala ini
- **RTO / RPO:** <1 jam / ~24 jam
- **Rollback strategy:** rollback 1-klik bawaan Cloudflare Pages ke deployment/commit sebelumnya

## 8. Constraints & Anti-patterns

### Technical Constraints
- Harus jalan di Cloudflare Workers runtime — tidak ada Node.js `fs`/`net` native modules di Pages Functions
- Seluruh endpoint API tetap dalam Workers free tier (100.000 request/hari)

### Forbidden Patterns
- Tidak ada `any` type di TypeScript
- Tidak hardcode nomor WA/harga di banyak tempat — harus dari satu sumber konten
- Tidak ada foto mentah (>1MB) langsung dipakai di halaman — wajib lewat pipeline kompresi (§7.3 brief awal)
- Tidak ada secret (Cloudflare API token dsb) tertulis di kode — hanya lewat Worker secret/env
- Tidak ada testimoni placeholder yang terlihat seperti asli tanpa penanda jelas
- Tidak ada endpoint `/api/admin/*` yang bisa diakses tanpa melalui Cloudflare Access
- Tidak ada `console.log` di production build — pakai logger terstruktur bila perlu

### Known Third-Party Limitations
- Cloudflare KV: eventual consistency (~60 detik propagasi global) — perubahan ticker mungkin tidak instan di semua lokasi edge, dapat diterima untuk kasus ini
- WhatsApp `wa.me`: tidak ada jaminan pesan pre-filled selalu terbuka otomatis di semua device/browser (tergantung app WA terpasang)

### Security Hard Rules
- Tidak ada secret di source code — Worker secret/env saja
- CORS `/api/*` dibatasi ke origin situs sendiri, tidak wildcard `*`

## 9. Development Phases

| Phase | Name | Focus | Applies when | Berlaku di proyek ini? |
|---|---|---|---|---|
| 1 | Foundation | Scaffolding, CI/CD, logging init, health endpoint, env var validation | Always | Ya |
| 2 | Domain & Data | KV schema (`ticker:messages`), tidak ada migrasi relasional | §4.5 Database bukan "none" | Ya (ringan — KV, bukan skema relasional penuh) |
| 3 | Core Features | Fitur P0 + unit test + backward-compatible API | Always | Ya |
| 4 | Integration | API pihak ketiga + circuit breaker + webhook | §4.1 ada third-party services | Minim — tidak ada API pihak ketiga yang dipanggil live saat runtime (Drive = arsip manual, WA = link statis). Cloudflare Access adalah komponen infra, bukan integrasi API eksternal di sini. |
| 5 | UI/UX | Screens/komponen + XSS/output encoding + SRI | Project Shape punya UI | Ya |
| 6 | Testing & QA | Unit + E2E + coverage check | Always | Ya |
| 7 | Deployment | Varian per Project Shape | Always | Ya — Cloudflare Pages/Workers serverless deploy |

6-month target (§6.1) di bawah 1.000 **concurrent** (realistis satu digit) — canary/staged-rollout **tidak diperlukan** untuk skala ini.

## 10. Open Questions

| # | Question | Options | Status |
|---|---|---|---|
| 1 | Success metric konkret untuk situs (§1) | Klik WA/bulan / conversion rate / jumlah sesi | PENDING | JAWAB : KLIK WA / BULAN 
| 2 | Halaman Klien/Venue digabung dengan S&K atau dipisah (dibawa dari brief sebelumnya) | Gabung (asumsi saat ini) / Pisah | PENDING | JAWAB : Dipisah
| 3 | Lisensi komersial font Bolden Van sudah dibeli? | Sudah / Belum, pakai fallback Fredoka-Baloo 2 sementara | PENDING | JAWAB: Fredoka Baloo 2
| 4 | Tier paket yang ditonjolkan sebagai "paling populer" | Tier tertentu / tidak perlu ditonjolkan | PENDING | JAWAB : tidak perlu ditonjolkan, supaya klient nanti berdiskusi dan memungkinkan untuk negosiasi
| 5 | Mekanisme consent testimoni asli (nama+kota dipublikasikan) | Izin tertulis via WA / form consent sederhana | PENDING | JAWAB : form consent saja

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-08-05 | Claude (dari brief Banu) | Initial draft dari Brief Template |

---

# PRD Self-Check

- [x] Project Shape stated unambiguously in §1 (fullstack, tidak `[ASSUMED]`)
- [x] §4.1 Database eksplisit "Cloudflare KV" (bukan "none") — Phase 2 diterapkan ringan
- [x] §4.1 third-party services eksplisit disebutkan (Google Drive, arsip-only) — Phase 4 diterapkan minim
- [x] §4.2 Architecture: 5 Key Architectural Decisions, masing-masing dengan alternatif nyata + alasan satu kalimat
- [x] §4.4 API Design disertakan (shape ini punya permukaan API — 2 endpoint)
- [x] §4.5 Data Model disertakan (Database bukan "none"), dengan pemisahan jelas KV vs Content Collections statis
- [x] §4.5 Entity Schema: field-level detail (type, nullable, default) untuk entity `TickerMessage`
- [x] §5 Features: setiap fitur P0 punya ≥2 acceptance criteria + ≥1 business rule
- [x] §6.1 Scale: estimasi 6 bulan dinyatakan (meski `[ASSUMED]`)
- [x] §6.4 Compliance: dinyatakan (WCAG 2.1 AA; UU PDP ringan, bukan dikosongkan)
- [x] §9 Phases: kolom "Berlaku di proyek ini?" konsisten dengan jawaban §4.1/§4.5

Knowledge extraction readiness:
- [x] §1 Identity + Shape, §2 Users, §3 Scope, §4 Technical Specification (subsections sesuai shape), §5 Feature Specifications — lengkap
- [x] §6 NFR, §7 Environment, §8 Constraints — lengkap
- [x] §9 Development Phases matrix konsisten secara internal

**✅ PRD READY FOR EXTRACTION — Save as prd.md → Run Prompt 01.**

Catatan: 5 item di §10 Open Questions **tidak** memblokir status "ready" (semua ditandai `[ASSUMED]`/`[DECISION NEEDED]` sesuai aturan Enrichment Mode, bukan dibiarkan kosong) — tapi disarankan dikonfirmasi sebelum Prompt 01 menghasilkan task breakdown final, khususnya #2 (struktur halaman) dan #3 (lisensi font) karena berdampak langsung ke kode yang akan ditulis.
