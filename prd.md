---
doc_id: PRD-CLASSMATE-INDONESIA-001
version: 1.2.0
status: draft
created: 2026-09-02
flow_compatibility: vibe-coding-v1.7
project_shape: fullstack
---

# Classmate Indonesia — Company Profile & Activity Catalog Website — Product Requirements Document

> Prompt injection check: input (jawaban Open Questions v1.1.0) discan, tidak ditemukan pola IGNORE/OVERRIDE/SYSTEM:/[INST]/"forget your instructions". Aman dilanjutkan.
> Mode Detection: 0/6 axis MISSING → **Enrichment Mode**. Versi ini adalah regenerasi v1.1.0 setelah ketiga Open Question (#6–#8) dijawab — jawaban ditandai `[RESOLVED v1.1.0→v1.2.0]` di tiap section yang berubah. Tidak ada desain baru yang terbuka dari jawaban kali ini (murni konfirmasi default & scoping) — §10 kosong di versi ini, lihat catatan di bagian itu.

## 1. Executive Summary
- **Project Shape:** fullstack
- **Problem:** Classmate Indonesia belum punya kanal digital mandiri untuk menampilkan katalog paket, dokumentasi aktivitas, dan bukti kerja ke calon klien B2C/B2B — presentasi produk masih bergantung pricelist PDF statis dan percakapan manual.
- **Solution:** Situs company profile bilingual (ID/EN) statis di Cloudflare Pages — katalog aktivitas & paket interaktif, social proof (logo klien/venue + testimoni), CTA WhatsApp langsung di tiap kartu paket.
- **Success metric:** Klik tombol WhatsApp per bulan (custom event, Cloudflare Web Analytics) — closed decision, lihat §6.5.
- **MVP deadline:** not specified

## 2. Users & Context
- **Primary users:** (B2C) pencari paket ulang tahun/art party anak; (B2B) procurement/marketing developer properti, sekolah, brand, venue/hotel; (Internal) admin Classmate yang mengelola ticker pengumuman
- **User goal:** klien eksternal — memahami paket & aktivitas lalu inquiry via WA tanpa perlu minta pricelist manual; admin — update pengumuman beranda tanpa minta developer redeploy
- **Current pain:** edukasi produk & portofolio sepenuhnya bergantung pricelist PDF + percakapan manual, tidak ada kanal presentasi mandiri yang linknya bisa dibagikan
- **Environment:** web browser (desktop & mobile), publik; panel admin juga browser, di balik Cloudflare Access
- **External API consumers:** none — internal only. Satu tambahan di v1.1.0: workflow backup terjadwal (§5, §7) memanggil endpoint admin situs ini sendiri lewat GitHub Actions — tetap dihitung internal (tooling operasional Classmate sendiri), bukan integrasi pihak ketiga/partner.

## 3. Scope

### 3.1 In-Scope Features
| Feature | Priority | Description |
|---|---|---|
| Situs marketing bilingual ID/EN | P0 — MVP | 7 halaman (beranda, tentang, layanan, aktivitas, klien-venue, kontak, syarat-ketentuan), tiap rute punya versi `/en` |
| Activity Explorer + galeri foto | P0 — MVP | React island — filter/cari 38 aktivitas & kelas, modal galeri foto per aktivitas |
| Kartu paket & harga + WA deep-link | P0 — MVP | Tier "Activity Only" (≥10 peserta, harga per peserta) & tier paket 25/50/100 peserta (flat, free transport); CTA WA pre-filled per paket |
| Social proof wall | P0 — MVP | 29 logo klien/venue + testimoni; logo di-resolve otomatis dari `src/assets/` saat build |
| Ticker pengumuman admin-editable | P1 | Maks. 3 pesan aktif tampil bersamaan, wajib ID+EN, toggle aktif, lewat KV + Pages Functions, tanpa redeploy |
| **[BARU v1.1.0]** Backup otomatis ticker (KV → repo) | P1 | Snapshot harian `ticker:messages` di-commit ke repo lewat GitHub Actions — resolusi Open Question #3 v1.0.0 |
| **[BARU v1.1.0]** Health check endpoint | P2 | `GET /api/health` — resolusi Open Question #5 v1.0.0, diprioritaskan Phase 1 |

Priority: P0 = must-have / P1 = important / P2 = nice-to-have

### 3.2 Out of Scope (explicit)
- Pembayaran online / checkout in-site — booking tetap lewat percakapan WhatsApp manual
- Akun/login untuk pengunjung publik — hanya satu panel admin internal di balik Cloudflare Access
- CMS untuk editor non-teknis — konten sengaja dikelola lewat data file + git
- Multi-tenant / multi-brand
- Object storage eksternal (R2 atau setara) — dihapus dari stack Sept 2026
- **[BARU v1.1.0]** Riwayat backup KV jangka panjang (snapshot per-hari yang disimpan selamanya) — desain di §5/§7 sengaja hanya menyimpan 1 file terkini (overwrite), bukan arsip historis, supaya repo tidak membengkak; RPO ~24 jam sudah cukup untuk risiko yang relevan (≤3 pesan teks pendek)

### 3.3 Future Considerations
- Playwright E2E suite (isi test filter aktivitas, klik WA, ganti bahasa) — tooling-nya di-setup Phase 1 (lihat §4.3), tapi penulisan suite lengkap tetap progresif, dituntaskan di Phase 6
- `ENABLE_ADMIN_PANEL` feature flag untuk soft-launch bertahap — `[ASSUMED]` Fase 2

## 4. Technical Specification

### 4.1 Tech Stack
- **Language & Runtime:** TypeScript 5.x; Cloudflare Workers (V8 isolate) untuk Pages Functions saat runtime; Node.js hanya di build time (`astro build`)
- **Framework:** Astro 4.x (`output: 'static'`, islands architecture) + React 18 (islands) + Tailwind CSS 3.x
- **Database:** none — Cloudflare KV dipakai sekadar key-value kecil (≤3 pesan ticker aktif, ≤10 tersimpan), bukan database aplikasi
- **ORM / Query builder:** omit (tidak ada database)
- **Cache:** tidak ada cache service terpisah — `/api/ticker` pakai `Cache-Control: public, max-age=60` di edge
- **Infrastructure:** Cloudflare Pages (hosting + CDN) + Cloudflare Pages Functions (endpoint API — lihat §4.4 untuk daftar lengkap, sekarang 4 endpoint)
- **Container orchestration:** none (edge/serverless by design — hard constraint proyek)
- **Key third-party services:** Cloudflare Access (gerbang admin — login manusia ≤50 user gratis, **+ Service Token untuk automasi**, lihat §5/§7); Cloudflare Web Analytics (cookie-less, custom event klik WA); **[BARU v1.1.0]** GitHub Actions (scheduled workflow, backup harian ticker — jalan di repo yang sama, tidak menambah deployable Cloudflare terpisah). Google Drive dipakai sebagai arsip foto mentah offline — tidak dipanggil live, tidak memicu Phase 4.
- **Webhook providers:** none
- **Frontend framework:** React 18 (islands, dihidrasi selektif lewat direktif `client:*` Astro)

### 4.2 Architecture
- **Pattern:** Static Site Generation (Jamstack/Islands Architecture) + Pages Functions tipis untuk data runtime-dinamis (ticker) + **satu scheduled workflow eksternal (GitHub Actions) untuk backup — tetap dalam repo yang sama, tidak menjadikan proyek ini microservices** (lihat catatan di bawah)
- **Module structure:** (tidak berubah dari v1.0.0 — lihat struktur folder lengkap di §4.2 versi sebelumnya; tambahan v1.1.0 hanya `functions/api/admin/ticker-export.ts` dan `.github/workflows/backup-ticker.yml`, keduanya di repo yang sama)
- **Key design patterns:** plain TS data modules sebagai "repository" build-time; satu handler per endpoint API; build-time asset resolver (`import.meta.glob` + `getImage()`); **[BARU v1.1.0]** scheduled-pull pattern untuk backup (GitHub Actions men-*pull* data lewat endpoint terproteksi, bukan aplikasi yang men-*push* — dipilih karena Cloudflare Pages tidak mendukung Cron Trigger native, hanya Workers berdiri sendiri yang bisa; lihat keputusan #6 di bawah)
- **Data flow:** Build-time: `src/data/*.ts` → `lib/media.ts` → halaman/komponen Astro → HTML statis + island. Runtime (ticker): browser → `GET /api/ticker` → KV read → `{data, error}`. Admin: Access JWT → `POST /api/admin/ticker` → validasi → overwrite KV. **[BARU v1.1.0] Backup:** GitHub Actions (cron harian) → `GET /api/admin/ticker-export` (header `CF-Access-Client-Id`/`CF-Access-Client-Secret`) → Access Service Token tervalidasi → baca KV → JSON dikembalikan → workflow commit ke `backups/ticker-messages.json` di repo (pakai `GITHUB_TOKEN` bawaan workflow, bukan PAT terpisah)
- **Key architectural decisions:**
  1. Astro over Next.js — performa & SEO default lebih kuat, JS minimal, deploy native ke Cloudflare Pages tanpa adapter
  2. Cloudflare KV over relational database (D1/Postgres) — satu-satunya data dinamis adalah ≤3 pesan ticker aktif
  3. Cloudflare Access over custom auth — gerbang admin aman tanpa membangun sistem auth sendiri
  4. Plain TS data modules over headless CMS — konten jarang berubah, lebih aman lewat git versioning
  5. **[SUPERSEDED 2026-09]** `src/assets/` + astro:assets over Cloudflare R2 — R2 di-enable dengan billing tapi nol dipakai; volume gambar kecil, muat sebagai build asset
  6. **[BARU v1.1.0]** GitHub Actions scheduled-pull over Cloudflare Cron Trigger + Worker terpisah — **dicek langsung: Cloudflare Pages tidak mendukung Cron Trigger native** (hanya Workers standalone bisa); opsi "Worker cron terpisah + KV binding sama" tetap memungkinkan tapi berarti deployable kedua. GitHub Actions dipilih karena (a) proyek tetap 1 deployable Cloudflare, (b) tidak perlu PAT terpisah — `GITHUB_TOKEN` bawaan workflow sudah cukup untuk commit ke repo sendiri, (c) Cloudflare Access sudah mendukung Service Token untuk kasus persis ini (machine-to-machine, bukan browser login)

**[QA NOTE — tetap berlaku dari v1.0.0]** Dokumentasi arsitektur sebelumnya (`knowledge.md` v1.0.0) menyebut "Astro Content Collections"; implementasi aktual pakai plain typed TS modules. Belum diperbarui di `knowledge.md` per penulisan PRD ini — bawa catatan ini ke langkah ekstraksi Knowledge berikutnya.

### 4.3 Code Standards
**[RESOLVED v1.0.0→v1.1.0 — Open Question #1: "setup sekarang"]** Keempat tooling berikut dikonfirmasi untuk di-setup di **Phase 1 (Foundation)**, bukan ditunda:
- **Naming — files:** kebab-case (`activity-card.astro`); PascalCase khusus komponen Astro/React
- **Naming — functions:** camelCase
- **Naming — classes/types:** PascalCase
- **Formatter:** Prettier — **dikonfirmasi, install + config di Phase 1**
- **Linter:** ESLint + `@typescript-eslint` + `eslint-plugin-astro` — **dikonfirmasi, install + config di Phase 1**
- **Testing framework:** Vitest (unit — util & Pages Functions) + Playwright (E2E) — **dikonfirmasi, install + config dasar di Phase 1**; catatan: "setup" ≠ "seluruh test ditulis" — penulisan unit test progresif tetap di Phase 3 (bersamaan fitur P0), suite E2E lengkap tetap dituntaskan di Phase 6, sesuai model fase §9
- **Test coverage target:** 70% pada logic non-UI (util, Pages Functions)
- **Error handling:** try-catch di tiap Pages Function handler; tidak ada unhandled promise rejection

### 4.4 API Design
- **API type:** REST (JSON) — **4 endpoint** (naik dari 2 di v1.0.0)
- **Base URL pattern:** `/api/`
- **Authentication method:** Cloudflare Access — dua mode: (a) JWT browser login (header `Cf-Access-Jwt-Assertion`) untuk admin manusia; (b) **[BARU v1.1.0]** Service Token (header `CF-Access-Client-Id` + `CF-Access-Client-Secret`) untuk automasi non-interaktif (backup workflow) — keduanya diverifikasi Access di edge, bukan manual di kode
- **Response envelope:** `{ data, error }`
- **Error format:** `{ code, message }` — sengaja tanpa `request_id`
- **Pagination:** tidak berlaku
- **API versioning strategy:** none — permukaan API terlalu kecil & 100% internal
- **Backward compatibility policy:** tidak formal, tapi Worker & frontend island wajib deploy sinkron
- **Rate limiting store:** tidak diperlukan
- **Webhook inbound verification:** n/a
- **Daftar endpoint:**
  | Method | Path | Auth | Deskripsi |
  |---|---|---|---|
  | GET | `/api/ticker` | none (publik) | Baca pesan ticker aktif |
  | POST | `/api/admin/ticker` | Access JWT (browser) | Overwrite penuh array ticker |
  | GET | `/api/admin/ticker-export` | Access Service Token | **[BARU v1.1.0]** Baca raw KV value untuk backup workflow |
  | GET | `/api/health` | none (publik) | **[BARU v1.1.0]** `{ status, kv_reachable }` — resolusi Open Question #5 |
- **KV value shape (bukan database formal, §4.1 Database = none):**
  ```
  Key: "ticker:messages" → TickerMessage[]
    - id: string
    - text_id: string, NOT NULL
    - text_en: string, NOT NULL
    - active: boolean, NOT NULL, default: true
    - priority: number, NOT NULL
    - updated_at: string (ISO 8601)
  ```
  Validasi POST: array 1–10 item. Overwrite penuh (idempotent). `/ticker-export` mengembalikan value ini apa adanya, tanpa transformasi.

### 4.6 Brand & Visual Identity
- **Color palette:** primary/CTA **Folly** `#FF0659`; secondary/aksen **Byzantine** `#BC22B8`; aksen terbatas Vivid Yellow `#F7E500`, Pumpkin `#FF7110`, Robin Egg Blue/Teal `#00DDC2`, Kiwi `#73D832`; latar Ivory `#FFF9F3`; kartu Putih `#FFFFFF`; teks Ink `#2B1B26`; teks sekunder Ink Soft `#6B5A66`
- **Typography:** **Fredoka** = primary/display. **[RESOLVED v1.0.0→v1.1.0 — Open Question #2]** **Baloo 2** = alternate display, dikonfirmasi khusus badge/eyebrow kecil saja, bukan konteks lain. **Human Sans** (OFL) = body/UI, file belum di-upload, fallback `system-ui`. Skala: H1 40–56px / H2 28–36px / H3 20–24px / body 16px / caption 14px, ~20% lebih kecil di mobile
- **Brand voice / tone:** **[RESOLVED v1.0.0→v1.1.0 — Open Question #4]** Diputuskan **tidak didefinisikan secara eksplisit sebagai kata sifat resmi** — ikuti sinyal yang sudah ada di UI (playful & rounded, tetap kredibel untuk audiens B2B). Tidak perlu dokumen tone/voice terpisah untuk saat ini.
- **Visual direction:** playful & rounded — radius 12/20/32px, shadow `0 8px 30px -8px rgba(43,27,38,.15)`. Signature element: garis jahitan putus-putus ("stitch line"). Tone modulation: `/klien-venue` lebih clean/formal, palet warna tetap sama.
- **Existing brand guide:** tidak ada dokumen terpisah — token hidup di `tailwind.config.mjs`
- **Scale note:** masih muat inline di `tailwind.config.mjs`, belum perlu `design-tokens.md` terpisah

## 5. Feature Specifications

### Feature: Situs Marketing Bilingual ID/EN
- **User story:** Sebagai calon klien, saya ingin membaca seluruh info perusahaan dalam bahasa yang saya pahami, sehingga saya bisa mengevaluasi Classmate tanpa hambatan bahasa.
- **Acceptance criteria:**
  - [ ] Ketujuh halaman tersedia di rute default (ID) dan prefix `/en`
  - [ ] Tidak ada halaman ID tanpa padanan EN atau sebaliknya
  - [ ] Nomor WA & harga bersumber dari satu konfigurasi (`site-config.ts`)
- **Business rules:** Klien & Venue dan Syarat & Ketentuan sengaja dipisah jadi 2 halaman
- **UI notes:** Tone `/klien-venue` lebih formal/clean
- **Priority:** P0

### Feature: Activity Explorer + Galeri Foto
- **User story:** Sebagai calon klien, saya ingin memfilter dan melihat dokumentasi foto tiap aktivitas, sehingga saya yakin dengan kualitas acara sebelum booking.
- **Acceptance criteria:**
  - [ ] React island menampilkan 38 aktivitas & kelas, bisa difilter/dicari
  - [ ] Modal per aktivitas menampilkan galeri foto atau placeholder "dokumentasi menyusul"
  - [ ] Foto lazy-load, teroptimasi WebP otomatis saat build
- **Business rules:** "Kelas Lainnya" (28 item, min. 20 peserta) wajib dibedakan visual dari 10 aktivitas inti
- **UI notes:** galeri pakai `<img>` biasa di React island; sumber tetap lewat `getImage()` build-time
- **Priority:** P0

### Feature: Kartu Paket & Harga + WhatsApp Deep-Link
- **User story:** Sebagai calon klien, saya ingin melihat pilihan paket beserta CTA langsung ke WhatsApp, sehingga saya bisa langsung follow-up.
- **Acceptance criteria:**
  - [ ] Setiap kartu paket punya tombol WA dengan pesan pre-filled berbeda per paket
  - [ ] Tidak ada satu tier pun ditandai "paling populer"
  - [ ] Klik tombol WA tercatat sebagai custom event di Cloudflare Web Analytics
- **Business rules:** Tier "Activity Only" min. 10 peserta, harga per peserta, tanpa free transport; tier paket 25/50/100 peserta harga flat, dapat free transport
- **UI notes:** harga & syarat minimum ditampilkan jelas per kartu
- **Priority:** P0

### Feature: Social Proof Wall (Logo Klien/Venue + Testimoni)
- **User story:** Sebagai calon klien B2B, saya ingin melihat logo klien/venue yang sudah pernah bekerja sama, sehingga saya percaya Classmate kredibel.
- **Acceptance criteria:**
  - [ ] 29 entri klien/venue tampil sebagai logo asli (jika tersedia) atau wordmark teks
  - [ ] Testimoni asli hanya tampil dengan nama+kota setelah consent form
  - [ ] Tidak ada testimoni placeholder tanpa penanda jelas
- **Business rules:** `name` + `city` adalah PII, wajib consent form
- **UI notes:** grid logo mengikuti tone modulation `/klien-venue`
- **Priority:** P0

### Feature: Ticker Pengumuman Admin-Editable
- **User story:** Sebagai admin Classmate, saya ingin mengubah pesan pengumuman di beranda tanpa minta developer redeploy.
- **Acceptance criteria:**
  - [ ] Admin login lewat Cloudflare Access, submit maks. 10 pesan
  - [ ] `POST /api/admin/ticker` idempotent — full overwrite
  - [ ] `GET /api/ticker` publik tetap jalan walau KV key belum pernah ditulis
- **Business rules:** Maks. 10 pesan tersimpan, maks. 3 aktif tampil bersamaan; tiap pesan wajib `text_id` & `text_en`
- **UI notes:** toggle `active`, bukan hard-delete
- **Priority:** P1

### Feature: Backup Otomatis Ticker (KV → Repo) — **BARU v1.1.0**
- **User story:** Sebagai admin/developer, saya ingin data ticker ter-backup otomatis ke git tiap hari, sehingga kalau KV bermasalah atau tertimpa keliru, saya bisa restore tanpa mengetik ulang manual.
- **Acceptance criteria:**
  - [ ] GitHub Actions workflow berjalan otomatis 1x/hari, cron `0 19 * * *` UTC = **02:00 WIB — dikonfirmasi (Open Question #6 v1.1.0)**
  - [ ] Workflow memanggil `GET /api/admin/ticker-export` pakai Access Service Token, hasilnya di-commit ke `backups/ticker-messages.json`
  - [ ] Kalau tidak ada perubahan sejak backup terakhir, workflow tidak membuat commit kosong
  - [ ] Kegagalan workflow (mis. endpoint down) tidak mem-block deploy situs utama — dua pipeline independen
- **Business rules:** Hanya snapshot **terkini** yang disimpan (file di-overwrite tiap run, bukan diarsipkan per-tanggal) — sesuai §3.2 Out of Scope
- **UI notes:** tidak ada UI — murni operasional/CI
- **Priority:** P1

### Feature: Health Check Endpoint — **BARU v1.1.0**
- **User story:** Sebagai developer/admin, saya ingin cara cepat mengecek situs & KV masih hidup, sehingga saya bisa diagnosis awal tanpa buka dashboard Cloudflare.
- **Acceptance criteria:**
  - [ ] `GET /api/health` publik, tanpa auth, mengembalikan `{ status: "ok" | "degraded", kv_reachable: boolean }`
  - [ ] Response time tidak menambah beban berarti ke Workers free tier (1 KV read ringan)
- **Business rules:** tidak expose detail internal (stack trace, nama binding) di response — hanya status boolean
- **UI notes:** tidak ada UI
- **Priority:** P2

## 6. Non-Functional Requirements

### 6.1 Performance & Scale
- Response time target: P95 < 300ms untuk `/api/ticker` & `/api/health`; Lighthouse Performance ≥90 untuk halaman statis `[ASSUMED]`
- Concurrent users/usage volume (initial): single-digit concurrent
- Concurrent users/usage volume (6-month target): ~1.000–5.000 visits/bulan (sumber: `knowledge.md` frontmatter). Concurrent load tetap di bawah 100 → **Simple Mode berlaku**

### 6.2 Security
- Auth standard: Cloudflare Access (Zero Trust) — JWT browser untuk admin manusia, **Service Token untuk automasi backup** (v1.1.0)
- JWT algorithm: ditangani Access di edge (JWKS-based)
- Password hashing: n/a
- PII handling: PII minimal — `name`+`city` testimoni, digerbangi consent form
- Error tracking PII policy: n/a Fase 1
- Session: ditangani Cloudflare Access
- Brute force protection: ditangani Cloudflare Access
- Secret rotation strategy: **[BARU v1.1.0]** Access Service Token (Client ID/Secret) — disimpan sebagai GitHub Actions repository secret, rotate manual lewat dashboard Access kalau dicurigai bocor; tidak ada rotation terjadwal otomatis `[ASSUMED]`

### 6.3 Scalability
- Growth expectation: tidak ada target agresif dinyatakan
- Scaling strategy: serverless auto-scale bawaan Cloudflare
- Caching: edge cache `max-age=60` pada `/api/ticker`
- DB scaling: n/a

### 6.4 Compliance
- Standards: WCAG 2.1 AA
- Regulations: UU PDP Indonesia baseline; tidak ada PCI-DSS/GDPR/HIPAA; belum ada requirement pentest

### 6.5 Observability
- Logging: Cloudflare Pages Functions real-time log bawaan; **[BARU v1.1.0]** GitHub Actions run log untuk workflow backup (retention default GitHub, 90 hari)
- Log levels: n/a
- Error tracking/crash reporting: none Fase 1; Sentry free tier opsi Fase 2
- Metrics: Cloudflare Web Analytics + Cloudflare Analytics bawaan
- Alerting: tidak ada alerting kustom untuk situs utama. **[RESOLVED v1.1.0→v1.2.0 — Open Question #7]** Untuk kegagalan workflow backup, cukup mengandalkan notifikasi email bawaan GitHub Actions (otomatis terkirim ke email pemilik repo saat workflow gagal) — dikonfirmasi tidak perlu channel tambahan (Slack, dsb.)
- **[RESOLVED v1.0.0→v1.1.0 — Open Question #5]** Health endpoint: `GET /api/health` → `{ status, kv_reachable }` — **dikonfirmasi, diprioritaskan Phase 1**, bukan lagi didokumentasikan tanpa implementasi

## 7. Environment & Configuration
- **Environments:** dev (`astro dev`/`wrangler dev` lokal) / preview (tiap PR) / prod
- **Required env vars (Cloudflare Pages):** `CLASSMATE_KV` (KV namespace binding)
- **[BARU v1.1.0] Required secrets (GitHub Actions repository secrets, bukan Cloudflare):** `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` (dari Access Service Token yang dibuat di dashboard Cloudflare Zero Trust), `SITE_EXPORT_URL` (opsional, bisa hardcode di workflow). `GITHUB_TOKEN` tidak perlu ditambah manual — otomatis tersedia per-workflow-run dengan permission `contents: write` yang perlu diaktifkan eksplisit di file workflow.
- **[RESOLVED v1.1.0→v1.2.0 — Open Question #8]** Access Service Token untuk `/api/admin/ticker-export` dipasang lewat **Access Application baru yang terpisah** dari Access Application `/admin` yang sudah ada — bukan menumpang policy admin manusia. Konkretnya, saat setup Zero Trust: (1) buat Access Application kedua dengan path match persis `/api/admin/ticker-export` di hostname yang sama; (2) policy-nya **hanya** "Service Auth" (menerima Service Token), tanpa opsi login email/Google seperti Access Application `/admin`; (3) generate Service Token baru khusus aplikasi ini, isi Client ID/Secret-nya ke `CF_ACCESS_CLIENT_ID`/`CF_ACCESS_CLIENT_SECRET` di GitHub Actions. Least-privilege: kalau Service Token ini bocor, blast radius-nya cuma baca-saja endpoint export, bukan kemampuan menulis `POST /api/admin/ticker`.
- **Feature flags:** tidak ada di Fase 1; `ENABLE_ADMIN_PANEL` `[ASSUMED]` Fase 2
- **CI/CD:** Cloudflare Pages native Git integration (auto-deploy tiap push ke `main`) — jalur terpisah dari **[BARU v1.1.0]** GitHub Actions scheduled workflow (backup harian, `.github/workflows/backup-ticker.yml`); dua pipeline independen, kegagalan salah satu tidak mem-block yang lain
- **CI secret masking:** env var Cloudflare Pages terenkripsi bawaan dashboard; GitHub Actions secrets otomatis di-mask di log run
- **Container secret handling:** n/a
- **Deployment / distribution command:** `npm run deploy` (`wrangler pages deploy dist`), atau otomatis lewat Git integration
- **Application versioning strategy:** semver ringan `[ASSUMED]`
- **Release trigger:** auto-deploy tiap merge ke `main`
- **Backup strategy:** source code + konten (termasuk gambar) ter-versioning penuh di GitHub; foto mentah permanen di Google Drive; **[RESOLVED v1.0.0→v1.1.0 — Open Question #3]** ticker KV di-backup **otomatis harian** ke `backups/ticker-messages.json` lewat GitHub Actions (lihat §5 Feature "Backup Otomatis Ticker") — bukan lagi proses manual atau tidak jelas
- **Backup retention:** file tunggal, di-overwrite tiap run (bukan arsip historis — lihat §3.2)
- **RTO/RPO:** RTO <1 jam (rollback 1-klik Cloudflare Pages); RPO ~24 jam — sekarang solid, cocok dengan kadensi backup harian yang baru dibangun (bukan lagi angka tanpa mekanisme jelas)
- **Rollback/update-channel strategy:** 1-klik rollback bawaan Cloudflare Pages ke deployment sebelumnya

## 8. Constraints & Anti-patterns

### Technical Constraints
- Harus jalan di Cloudflare Workers runtime — tidak ada modul native Node.js `fs`/`net` di Pages Functions
- Seluruh endpoint API tetap dalam Workers free tier (100.000 request/hari)
- Astro output harus tetap `static`
- **[BARU v1.1.0]** Backup workflow tidak boleh jadi Cloudflare Worker/Cron terpisah — harus tetap GitHub Actions di repo yang sama (keputusan §4.2 #6), supaya proyek tetap 1 deployable Cloudflare

### Forbidden Patterns
- Tidak ada tipe `any` di TypeScript
- Tidak hardcode nomor WA/harga di banyak tempat
- Tidak ada foto mentah (>1–2MB) langsung dipakai di halaman
- Tidak ada secret tertulis di kode
- Tidak ada testimoni placeholder tanpa penanda jelas
- Tidak ada state/kategori yang hanya dibedakan lewat warna tanpa label teks/ikon
- Tidak ada motion tanpa fallback `prefers-reduced-motion`
- Tidak ada endpoint `/api/admin/*` yang bisa diakses tanpa melalui Cloudflare Access
- Tidak ada `console.log` di production build
- CORS `/api/*` dibatasi origin situs sendiri, tidak wildcard `*`
- **[BARU v1.1.0]** `CF_ACCESS_CLIENT_SECRET` tidak boleh muncul di log workflow atau commit message — hanya sebagai GitHub Actions secret

### Known Third-Party Limitations
- Cloudflare KV eventual consistency (~60 detik propagasi global)
- WhatsApp `wa.me` tidak menjamin pesan pre-filled selalu terbuka otomatis di semua device
- **[BARU v1.1.0]** Cloudflare Pages tidak mendukung Cron Trigger native — dikonfirmasi lewat dokumentasi resmi, itu sebabnya backup dijalankan dari GitHub Actions, bukan Worker cron internal

### Security Hard Rules
- Tidak ada secret di source code
- CORS tidak boleh wildcard `*` di non-dev
- **[CONFIRMED v1.2.0]** Access Service Token untuk `/api/admin/ticker-export` wajib lewat Access Application terpisah dari policy login admin manusia (least privilege — resolusi Open Question #8, detail setup di §7), bukan menumpang policy `/admin` yang sudah ada

## 9. Development Phases

| Phase | Name | Focus | Applies when | Status untuk proyek ini |
|---|---|---|---|---|
| Phase 1 | Foundation | Scaffolding, CI/CD, logging init, health endpoint, env var validation | Always | ✓ Applies — **[UPDATED v1.1.0]** kini eksplisit mencakup: install+config Prettier/ESLint/Vitest/Playwright (Q1), implementasi `GET /api/health` (Q5) |
| Phase 2 | Domain & Data | Models, migrasi, soft-delete | §4.5 Database bukan "none" | Tidak berlaku ketat (Database = none) — skema `TickerMessage` dilipat ke Phase 3 |
| Phase 3 | Core Features | Fitur P0 + unit test | Always | ✓ Applies — termasuk validasi payload `TickerMessage`, unit test progresif (Vitest, tooling dari Phase 1) |
| Phase 4 | Integration | API pihak ketiga + idempotency | §4.1 ada third-party services | ✓ Applies — endpoint `ticker-export`, Access Service Token (Application terpisah, §7), workflow GitHub Actions. **[UPDATED v1.2.0]** Semua keputusan scoping sudah final (Q6–Q8 resolved) — tidak ada lagi blocker keputusan untuk memulai phase ini |
| Phase 5 | UI/UX | Layar/komponen + aksesibilitas | Shape punya UI | ✓ Applies |
| Phase 6 | Testing & QA | Integration + E2E + coverage | Always | ✓ Applies — tooling sudah ada dari Phase 1, phase ini fokus menuntaskan cakupan test (termasuk E2E Playwright) |
| Phase 7 | Deployment | Variant per shape | Always | ✓ Applies — Cloudflare Pages Git-integration deploy; canary/staged-rollout tidak diperlukan |

## 10. Open Questions

Tidak ada Open Question tersisa per v1.2.0. Ketiga pertanyaan v1.1.0 (#6 jadwal backup, #7 kanal notifikasi kegagalan, #8 scoping Access Application) sudah terjawab dan murni konfirmasi — tidak membuka desain/trade-off baru yang perlu diputuskan, jadi tidak ada nomor baru ditambahkan di sini. Delapan pertanyaan dari v1.0.0–v1.1.0 sudah terjawab dan terintegrasi ke section terkait — lihat tag `[RESOLVED ...]` di §4.3, §4.6, §5, §6.5, §7, §8.

Kalau saat implementasi (Phase 1–7) muncul keputusan baru yang butuh konfirmasi Banu, tambahkan di sini di regenerasi berikutnya — jangan diputuskan sepihak di tengah coding untuk hal yang sifatnya trade-off produk/keamanan (murni pilihan teknis internal, seperti nama variabel, boleh langsung jalan).

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-09-02 | Banu (via Claude) | Initial draft — disusun dari brief developer, direkonsiliasi dengan kondisi kode aktual pasca migrasi R2→astro:assets |
| 1.1.0 | 2026-09-02 | Banu (via Claude) | Regenerasi: 5 Open Question v1.0.0 dijawab & diintegrasikan; jawaban Q3 (backup KV "perlu dibangun") memicu desain baru — endpoint `ticker-export`, Access Service Token, GitHub Actions scheduled workflow (Cloudflare Pages dikonfirmasi tidak mendukung Cron Trigger native); jawaban Q5 menambah fitur `GET /api/health`; 3 Open Question baru muncul dari desain ini (#6–#8) |
| 1.2.0 | 2026-09-02 | Banu (via Claude) | Regenerasi: Open Question #6–#8 v1.1.0 dijawab & diintegrasikan (jadwal backup 02:00 WIB dikonfirmasi; notifikasi kegagalan cukup email GitHub bawaan; Access Service Token dipasang lewat Access Application terpisah dari `/admin`, detail setup ditulis di §7). Tidak ada Open Question baru — PRD dianggap final untuk mulai Phase 1 |

---

# PRD Self-Check

- [x] Project Shape stated unambiguously in §1 (fullstack) — desain backup (§4.2 #6) sengaja dipilih supaya shape TIDAK berubah jadi microservices
- [x] §4.1 Database explicitly "none"
- [x] §4.1 third-party services explicitly listed (Access — 2 mode auth, Web Analytics, GitHub Actions)
- [x] §4.2 Architecture: 6 Key Architectural Decisions, tiap satu dengan alternatif nyata + alasan
- [x] §4.4 API Design present, 4 endpoint terdaftar lengkap dengan auth mode masing-masing
- [x] §4.5 Data Model tetap diringkas ke §4.4 (Database = none)
- [x] §5 Features: 7 fitur, tiap P0 punya ≥3 acceptance criteria + ≥1 business rule; fitur backup & health check juga lengkap
- [x] §6.1 Scale: 6-month usage estimate stated
- [x] §6.4 Compliance: WCAG 2.1 AA + UU PDP baseline
- [x] §9 Phases: Phase 4 applicable dan tidak lagi punya blocker keputusan (Q6–Q8 resolved)
- [x] §10 Open Questions: kosong — semua 8 pertanyaan lintas v1.0.0–v1.2.0 sudah terjawab

Knowledge extraction readiness:
- [x] §1–§5 lengkap
- [x] §6–§8 lengkap, termasuk security hard rule Service Token & Access Application scoping yang sudah final
- [x] §9 Phases matrix konsisten, tidak ada phase yang menunggu keputusan lagi

✅ **PRD READY FOR EXTRACTION — FINAL** — tidak ada Open Question tersisa. Satu catatan yang tetap dibawa (bukan blocker, tapi perlu ditindaklanjuti saat Knowledge extraction): `[QA NOTE]` di §4.2 soal `knowledge.md` v1.0.0 yang masih menyebut "Astro Content Collections" — perlu diluruskan saat prd.md ini diekstrak jadi knowledge.md versi baru, supaya dokumentasi arsitektur akhirnya konsisten dengan kode nyata.
