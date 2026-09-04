---
project: Classmate Indonesia — Company Profile & Activity Catalog Website
knowledge_version: 1.0.0
changelog_version: 1.0.2
created: 2026-09-03
status: in_progress
milestone: 1 of 1
project_shape: fullstack
simple_mode: false
---

> **Phase Applicability diterapkan sebelum derivasi task:** Phase 2 (Domain & Data) **tidak digenerate** — `knowledge.md` §2 Database = none. Phase 1, 3, 4, 5, 6, 7 semuanya applies (fullstack, punya UI, punya third-party services). Phase 7 varian **Server** (fullstack). `simple_mode: false` → Stage 2 load test dan circuit breaker (bila ada outbound call yang relevan) **tidak** disederhanakan/skip.
>
> Proyek ini **existing**, bukan proyek baru — mayoritas fitur P0 (situs bilingual, Activity Explorer, kartu paket, social proof wall, ticker) sudah berjalan di produksi. Task di bawah adalah **kerja yang tersisa** (tooling, testing, integrasi backup, hardening, deployment gate) — bukan membangun ulang yang sudah ada. Task #001 karena itu adalah **"Environment Audit & Security Baseline"**, sesuai aturan template untuk existing project, bukan scaffolding dari nol.

## [COMPLETED]
> Changelog v1.0.0 initialized from knowledge.md v1.0.0. Shape: fullstack. 27 task, Phase 2 tidak digenerate (Database = none).

### Task #001 — Environment Audit & Security Baseline ✅
- **Completed:** 2026-09-03
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-001-environment-audit-security-baseline
- **Files created / modified:**
  - `.gitignore` — added `.env`, `*.pem`, `*.key`, `*.p12`, `secrets/` patterns to prevent sensitive files from being committed
  - `docs/audit-baseline.md` — new file documenting audit findings: zero hardcoded secrets detected, KV binding confirmed, anti-patterns documented
- **Acceptance criteria met:**
  - [x] `.gitignore` mengandung `.env`, `*.pem`, `*.key`, `*.p12`, `secrets/` — added all required patterns
  - [x] Grep menyeluruh (`src/`, `functions/`, root config) untuk pola secret/token hardcoded menghasilkan nol temuan, didokumentasikan di `docs/audit-baseline.md`
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK
- **Decisions made:**
  - [ARCH] .gitignore updated as security baseline for existing project
  - [DOC] audit-baseline.md created to document environment security audit
- **Notes:** no deviations — clean audit, no hardcoded secrets found in codebase
- **Knowledge drift:** none

### Task #002 — Install & Configure Prettier ✅
- **Completed:** 2026-09-04
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-002-install-configure-prettier
- **Files created / modified:**
  - `.prettierrc.json` — new config: singleQuote, trailingComma all, printWidth 100, semicolons, LF endings
  - `.prettierignore` — new file excluding dist/, src/assets/, public/, node_modules/, and non-source files
  - `package.json` — added `prettier` devDependency + `format`/`format:check` scripts
  - `package-lock.json` — updated lockfile
  - 11 source files reformatted to match Prettier config (functions/api/, src/components/, src/data/, src/lib/, src/styles/)
- **Acceptance criteria met:**
  - [x] `npx prettier --check .` runs without config errors against entire source tree
  - [x] `format`/`format:check` scripts added to `package.json` and verified working
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Build OK (15 pages built successfully); `npm run format:check` passes after formatting
- **Decisions made:**
  - [CONFIG] Prettier config: singleQuote, trailingComma all, printWidth 100, endOfLine lf — matches existing code conventions
  - [CONFIG] .prettierignore excludes dist/, src/assets/, public/, node_modules/, and non-source files (md, json, yml)
- **Notes:** no deviations — clean install, 11 files auto-formatted to match config
- **Knowledge drift:** none

---

## [IN PROGRESS]

### Task #003 — Install & Configure ESLint
- **Phase:** Phase 1 — Foundation
- **Scope:** Install ESLint + `@typescript-eslint` + `eslint-plugin-astro`, config selaras dengan konvensi kode existing (kebab-case/camelCase/PascalCase per `knowledge.md` §4).
- **Files to create / modify:** `package.json` (devDependency), `eslint.config.mjs` (baru, flat config)
- **Acceptance criteria:**
  - [ ] `npx eslint .` berjalan bersih (0 error) terhadap kode existing, atau setiap exception didokumentasikan dengan alasan di `eslint.config.mjs`
  - [ ] Aturan `no-explicit-any` aktif sebagai error (selaras larangan `any` di `knowledge.md` §9)
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

---

## [NEXT TASKS]

### Phase 1 — Foundation

#### Task #004 — Install & Configure Vitest
- **Phase:** Phase 1 — Foundation
- **Scope:** Setup Vitest untuk unit test util & Pages Functions, termasuk konfigurasi coverage report menuju target 70% (`knowledge.md` §4).
- **Files to create / modify:** `package.json` (devDependency + skrip `test`), `vitest.config.ts` (baru)
- **Acceptance criteria:**
  - [ ] `npm run test` berjalan (walau 0 test dulu) tanpa error konfigurasi
  - [ ] `npm run test -- --coverage` menghasilkan report coverage yang bisa dibaca (text + lcov)
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

#### Task #005 — Install & Configure Playwright
- **Phase:** Phase 1 — Foundation
- **Scope:** Setup Playwright dengan base config (browser target, base URL lokal/preview) — belum menulis suite lengkap, itu Task #019 di Phase 6.
- **Files to create / modify:** `package.json` (devDependency + skrip `test:e2e`), `playwright.config.ts` (baru), `e2e/` (folder baru, kosong/placeholder)
- **Acceptance criteria:**
  - [ ] `npx playwright install` + `npm run test:e2e` berjalan tanpa error konfigurasi terhadap 1 smoke test placeholder (mis. halaman beranda me-render)
  - [ ] Base URL config bisa dioverride lewat env var (lokal vs preview deployment)
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

#### Task #006 — Set Up CI Pipeline
- **Phase:** Phase 1 — Foundation
- **Scope:** GitHub Actions workflow CI: lint → type-check (`astro check`) → unit test → build, jalan tiap push/PR. **Terpisah dari** workflow backup ticker (Task #014) — dua workflow independen.
- **Files to create / modify:** `.github/workflows/ci.yml` (baru)
- **Acceptance criteria:**
  - [ ] Workflow gagal (exit non-zero) kalau lint, type-check, atau test gagal — diverifikasi dengan sengaja merusak satu langkah lalu memastikan CI merah
  - [ ] Workflow lulus hijau di kondisi kode saat ini setelah Task #002–#005 selesai
- **Dependencies:** Task #002, Task #003, Task #004, Task #005
- **Decisions made:** (fill after execution — never leave blank)

#### Task #007 — Pre-commit Hooks Blocking Secrets
- **Phase:** Phase 1 — Foundation
- **Scope:** Pasang pre-commit hook (format + lint staged files, tolak commit yang menyertakan `.env`).
- **Files to create / modify:** `package.json` (devDependency `husky` + `lint-staged`), `.husky/pre-commit` (baru)
- **Acceptance criteria:**
  - [ ] Percobaan `git commit` dengan file `.env` staged ditolak oleh hook
  - [ ] Percobaan commit dengan kode yang melanggar Prettier/ESLint diblokir atau auto-fix sebelum commit selesai
- **Dependencies:** Task #002, Task #003
- **Decisions made:** (fill after execution — never leave blank)

#### Task #008 — Implement Health Check Endpoint
- **Phase:** Phase 1 — Foundation
- **Scope:** `GET /api/health` publik, baca ringan dari KV, kembalikan `{ status, kv_reachable }` sesuai `knowledge.md` §5/§8 — tanpa expose detail internal.
- **Files to create / modify:** `functions/api/health.ts` (baru)
- **Acceptance criteria:**
  - [ ] `GET /api/health` mengembalikan `200` dengan `{ status: "ok", kv_reachable: true }` saat KV bisa diakses
  - [ ] Simulasi KV tidak terjangkau (mis. mock binding gagal) menghasilkan `{ status: "degraded", kv_reachable: false }`, bukan crash/500 tanpa body
  - [ ] Unit test written and passing for new logic
  - [ ] Test is isolated: sets up and tears down its own state
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

#### Task #009 — Add Startup Env Var Validation
- **Phase:** Phase 1 — Foundation
- **Scope:** Setiap Pages Function yang butuh binding `CLASSMATE_KV` gagal cepat dengan error jelas (bukan exception generik) kalau binding tidak ada di environment — dicek di `ticker.ts`, `admin/ticker.ts`, `health.ts`.
- **Files to create / modify:** `functions/api/ticker.ts`, `functions/api/admin/ticker.ts`, `functions/api/health.ts` (tambah guard clause di awal tiap handler)
- **Acceptance criteria:**
  - [ ] Memanggil endpoint tanpa binding `CLASSMATE_KV` (disimulasikan di test) mengembalikan `{ error: { code, message } }` yang jelas, bukan stack trace mentah
  - [ ] Pesan error tidak membocorkan detail internal (nama file, path absolut)
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

### Phase 3 — Core Features

#### Task #010 — Unit Tests for Ticker POST Validation Logic
- **Phase:** Phase 3 — Core Features
- **Scope:** Tulis unit test untuk validasi payload di `POST /api/admin/ticker` (array 1–10 item, tiap item type-checked terhadap skema `TickerMessage`) — logic ini ditandai high-blast-radius di `knowledge.md` §9, saat ini nol test.
- **Files to create / modify:** `functions/api/admin/ticker.test.ts` (baru)
- **Acceptance criteria:**
  - [ ] Payload valid (1–10 item lengkap) lolos validasi
  - [ ] Payload invalid (11 item, field `text_id`/`text_en` hilang, tipe salah) ditolak dengan `{ error: { code, message } }`, KV tidak tertulis
  - [ ] Unit test written and passing for new logic
  - [ ] Test is isolated: sets up and tears down its own state (mock KV per test, tanpa state bocor antar test)
- **Dependencies:** Task #004
- **Decisions made:** (fill after execution — never leave blank)

#### Task #011 — Unit Tests for Media Resolver Functions
- **Phase:** Phase 3 — Core Features
- **Scope:** Test `activityImages()`, `clientLogo()`, `venueLogo()` di `src/lib/media.ts` — fungsi ini ditandai high-blast-radius (gagal diam-diam kalau nama file tidak cocok konvensi), saat ini nol test.
- **Files to create / modify:** `src/lib/media.test.ts` (baru)
- **Acceptance criteria:**
  - [ ] File dengan nama sesuai konvensi (`activity-{slug}-1.ext`, `client-{slug}.ext`) ter-resolve dan urut benar (`-1` sebelum `-2`)
  - [ ] File dengan nama tidak cocok konvensi menghasilkan array kosong/`null` (bukan throw) — perilaku fallback yang didokumentasikan tetap benar
  - [ ] Unit test written and passing for new logic
  - [ ] Test is isolated: sets up and tears down its own state (fixture folder sementara per test, dibersihkan setelahnya)
- **Dependencies:** Task #004
- **Decisions made:** (fill after execution — never leave blank)

#### Task #012 — Implement Ticker Export Endpoint
- **Phase:** Phase 3 — Core Features
- **Scope:** `GET /api/admin/ticker-export` — baca raw value KV `ticker:messages` apa adanya, untuk dikonsumsi workflow backup (Task #014). Endpoint ini sendiri tidak butuh tahu soal GitHub Actions — hanya perlu diproteksi Access (setup Access-nya di Task #013).
- **Files to create / modify:** `functions/api/admin/ticker-export.ts` (baru)
- **Acceptance criteria:**
  - [ ] `GET /api/admin/ticker-export` mengembalikan isi KV `ticker:messages` sebagai JSON tanpa transformasi
  - [ ] KV key belum pernah ditulis → mengembalikan array kosong `[]`, bukan error
  - [ ] Unit test written and passing for new logic
  - [ ] Test is isolated: sets up and tears down its own state
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

### Phase 4 — Integration

> **Catatan circuit breaker:** aplikasi ini tidak melakukan outbound call ke API pihak ketiga dari kode runtime-nya sendiri (KV read/write saja; verifikasi Access terjadi di edge Cloudflare, bukan panggilan aplikasi). Karena itu, walau `simple_mode: false`, **tidak ada task circuit breaker** di bawah — kriteria itu genuinely tidak berlaku untuk shape integrasi proyek ini (integrasi berjalan sebagai *scheduled-pull* dari luar, bukan *outbound push* dari aplikasi).

#### Task #013 — Create Dedicated Access Application for Export Endpoint
- **Phase:** Phase 4 — Integration
- **Scope:** Buat Access Application baru di Cloudflare Zero Trust, path match `/api/admin/ticker-export`, policy **Service Auth saja** (tanpa login email/Google) — terpisah dari Access Application `/admin` yang sudah ada, sesuai keputusan least-privilege di `knowledge.md` §3/§9.
- **Files to create / modify:** Tidak ada kode — konfigurasi dashboard Cloudflare Zero Trust. `docs/access-setup.md` (baru — catat Application ID & ringkasan policy untuk referensi tim, bukan credential-nya)
- **Acceptance criteria:**
  - [ ] Request ke `/api/admin/ticker-export` tanpa header `CF-Access-Client-Id`/`CF-Access-Client-Secret` ditolak (401/403) oleh Access, tidak sampai ke kode aplikasi
  - [ ] Request dengan Service Token yang valid untuk Application ini berhasil (200); Service Token dari Application `/admin` yang lama (kalau beda) tidak otomatis punya akses ke path ini
- **Dependencies:** Task #012
- **Decisions made:** (fill after execution — never leave blank)

#### Task #014 — Build GitHub Actions Backup Workflow
- **Phase:** Phase 4 — Integration
- **Scope:** Workflow terjadwal harian (`0 19 * * *` UTC = 02:00 WIB) — panggil `/api/admin/ticker-export` pakai Service Token, commit `backups/ticker-messages.json` (overwrite, no-op kalau tidak berubah).
- **Files to create / modify:** `.github/workflows/backup-ticker.yml` (baru)
- **Acceptance criteria:**
  - [ ] Trigger manual (`workflow_dispatch`) berhasil: memanggil endpoint, commit file kalau ada perubahan, permission `contents: write` aktif eksplisit di workflow
  - [ ] Menjalankan workflow dua kali berturut-turut tanpa perubahan data ticker menghasilkan **nol commit baru** di run kedua (idempotent, bukan commit kosong)
- **Dependencies:** Task #012, Task #013
- **Decisions made:** (fill after execution — never leave blank)

#### Task #015 — Verify WhatsApp Click Analytics Event Tracking
- **Phase:** Phase 4 — Integration
- **Scope:** Pastikan tiap tombol WA di kartu paket mengirim custom event ke Cloudflare Web Analytics (success metric closed decision, `knowledge.md` §1/§8) — audit apakah sudah terpasang di kode existing, implementasikan kalau belum.
- **Files to create / modify:** komponen kartu paket terkait (`src/components/PackageCard.astro` atau setara — dikonfirmasi saat audit) — TBD tepatnya sampai audit awal task ini menemukan file mana yang menangani klik WA saat ini
- **Acceptance criteria:**
  - [ ] Klik tombol WA di kartu paket manapun memicu custom event Cloudflare Web Analytics yang terverifikasi (via dashboard/test event), bukan cuma navigasi ke `wa.me`
  - [ ] Event membawa identitas paket (nama tier) supaya klik per-paket bisa dibedakan, bukan satu event generik untuk semua tombol
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

### Phase 5 — UI/UX

#### Task #016 — WCAG 2.1 AA Accessibility Audit
- **Phase:** Phase 5 — UI/UX
- **Scope:** Audit ketujuh halaman × 2 bahasa terhadap WCAG 2.1 AA (kontras warna terhadap palet `knowledge.md` §6, label form, alt text, navigasi keyboard) — perbaiki temuan yang gagal.
- **Files to create / modify:** `docs/a11y-audit.md` (baru — catat temuan) + file komponen yang diperbaiki (TBD sampai audit menemukan pelanggaran spesifik)
- **Acceptance criteria:**
  - [ ] Audit otomatis (axe-core/Lighthouse a11y) terhadap 14 rute (7 halaman × ID/EN) menghasilkan nol pelanggaran level AA yang serius/kritis
  - [ ] Navigasi penuh-keyboard (tanpa mouse) memungkinkan mengakses seluruh interaksi utama (filter aktivitas, modal galeri, tombol WA)
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

#### Task #017 — XSS / Output Encoding Review
- **Phase:** Phase 5 — UI/UX
- **Scope:** Pastikan tidak ada penggunaan `set:html` (Astro) atau `dangerouslySetInnerHTML` (React) terhadap data yang tidak sepenuhnya dikontrol developer (mis. konten dari KV/ticker) — Astro/React escape otomatis secara default, task ini memverifikasi tidak ada bypass yang tidak perlu.
- **Files to create / modify:** hasil grep terhadap `src/`, `functions/` — perbaikan di file spesifik hanya jika ditemukan pelanggaran (TBD, tergantung hasil audit)
- **Acceptance criteria:**
  - [ ] Grep `set:html`/`dangerouslySetInnerHTML` di seluruh codebase menghasilkan nol match, atau tiap match yang ditemukan didokumentasikan dengan alasan aman (data sepenuhnya statis, bukan dari input)
  - [ ] Pesan ticker (dari KV, ditulis admin) dirender sebagai teks biasa, bukan HTML yang di-inject mentah
- **Dependencies:** Task #001
- **Decisions made:** (fill after execution — never leave blank)

### Phase 6 — Testing & QA

#### Task #018 — Verify Test Coverage Meets 70% Target
- **Phase:** Phase 6 — Testing & QA
- **Scope:** Jalankan `vitest --coverage` setelah Task #010/#011 (dan unit test lain yang ditambahkan sepanjang jalan), verifikasi coverage logic non-UI (util, Pages Functions) ≥70% sesuai `knowledge.md` §4.
- **Files to create / modify:** Tidak ada kode baru — verifikasi report coverage yang dihasilkan Task #004's config
- **Acceptance criteria:**
  - [ ] Coverage report (`text` + `lcov`) menunjukkan ≥70% pada `functions/` dan `src/lib/`
  - [ ] Bagian yang di bawah 70% (jika ada) didaftar eksplisit sebagai technical debt di `docs/audit-baseline.md`, bukan diam-diam dilewati
- **Dependencies:** Task #010, Task #011
- **Decisions made:** (fill after execution — never leave blank)

#### Task #019 — Write Playwright E2E Core Flows
- **Phase:** Phase 6 — Testing & QA
- **Scope:** Tuntaskan suite E2E untuk 3 alur inti yang disebut `knowledge.md` §4: filter aktivitas, klik tombol WA, ganti bahasa (ID↔EN).
- **Files to create / modify:** `e2e/activity-filter.spec.ts`, `e2e/wa-click.spec.ts`, `e2e/language-switch.spec.ts` (baru)
- **Acceptance criteria:**
  - [ ] `activity-filter.spec.ts`: memfilter Activity Explorer menampilkan hasil yang sesuai kata kunci, modal galeri terbuka untuk aktivitas yang punya foto
  - [ ] `wa-click.spec.ts`: klik tombol WA di tiap tier paket menghasilkan link `wa.me` dengan pesan pre-filled yang berbeda per paket
  - [ ] `language-switch.spec.ts`: berpindah dari rute ID ke `/en` (dan sebaliknya) mempertahankan halaman yang sama, konten berganti bahasa
  - [ ] Unit test written and passing for new logic
  - [ ] Test is isolated: sets up and tears down its own state (browser context baru per test, tanpa state bersama antar test)
- **Dependencies:** Task #005
- **Decisions made:** (fill after execution — never leave blank)

#### Task #020 — Bilingual Route Parity Regression Check
- **Phase:** Phase 6 — Testing & QA
- **Scope:** Verifikasi otomatis bahwa ketujuh halaman punya padanan ID dan `/en` (hard constraint `knowledge.md`), mencegah regresi kalau ada halaman baru ditambah tanpa versi bahasa satunya.
- **Files to create / modify:** `e2e/route-parity.spec.ts` (baru) — atau skrip Node ringan di `scripts/check-route-parity.mjs` kalau lebih sesuai dari sekadar E2E test (dipilih saat eksekusi)
- **Acceptance criteria:**
  - [ ] Test/skrip menemukan seluruh rute di `src/pages/` (non-`en/`) dan memverifikasi padanan `en/` ada untuk masing-masing, gagal (exit non-zero) kalau ada yang timpang
  - [ ] Dijalankan sebagai bagian CI (Task #006), bukan langkah manual terpisah
- **Dependencies:** Task #005, Task #006
- **Decisions made:** (fill after execution — never leave blank)

### Phase 7 — Deployment (Server variant)

> SIGTERM graceful-drain (kriteria standar template untuk server tradisional) **tidak berlaku** untuk shape ini — Cloudflare Pages Functions berjalan di isolate model Workers, tanpa proses persisten yang menerima SIGTERM; siklus hidup request ditangani penuh oleh platform. Kriteria itu sengaja tidak dijadikan task.

#### Task #021 — Application Version Tagging & Redeploy Test
- **Phase:** Phase 7 — Deployment
- **Scope:** Terapkan tagging git semver ringan (`knowledge.md` §7) dan verifikasi tag lama bisa di-redeploy cepat lewat Cloudflare Pages.
- **Files to create / modify:** tidak ada file kode — proses release (didokumentasikan di `docs/release-process.md`, baru)
- **Acceptance criteria:**
  - [ ] Tag `v1.0.0`-style dibuat untuk state saat ini, ter-deploy sesuai commit yang di-tag
  - [ ] Redeploy dari tag versi sebelumnya (simulasi) selesai dalam <10 menit lewat dashboard Cloudflare Pages
- **Dependencies:** Task #006
- **Decisions made:** (fill after execution — never leave blank)

#### Task #022 — Document & Test Rollback Procedure
- **Phase:** Phase 7 — Deployment
- **Scope:** Dokumentasikan & uji langkah rollback 1-klik Cloudflare Pages ke deployment sebelumnya.
- **Files to create / modify:** `docs/rollback-procedure.md` (baru)
- **Acceptance criteria:**
  - [ ] Rollback dari deployment saat ini ke deployment sebelumnya diuji sekali di dashboard, selesai <10 menit, situs tetap dapat diakses selama proses
  - [ ] Langkah rollback didokumentasikan cukup detail untuk diikuti orang lain selain yang menguji
- **Dependencies:** Task #021
- **Decisions made:** (fill after execution — never leave blank)

#### Task #023 — Staging Smoke Test & Env Var Confirmation
- **Phase:** Phase 7 — Deployment
- **Scope:** Deploy ke preview/staging Cloudflare Pages, smoke-test halaman utama + endpoint API, konfirmasi binding `CLASSMATE_KV` benar-benar ada di environment tersebut (bukan cuma di `wrangler.toml`).
- **Files to create / modify:** tidak ada file kode
- **Acceptance criteria:**
  - [ ] Ketujuh halaman × 2 bahasa termuat tanpa error 500 di preview deployment
  - [ ] `GET /api/health` di preview mengembalikan `kv_reachable: true`
- **Dependencies:** Task #006, Task #008
- **Decisions made:** (fill after execution — never leave blank)

#### Task #024 — Two-Stage Load Test
- **Phase:** Phase 7 — Deployment
- **Scope:** `simple_mode: false` → **Stage 2 wajib dijalankan, tidak di-skip**. Stage 1 Smoke: 10 VU / 60 detik. Stage 2 Capacity: VU = max(initial ~10 concurrent, 6-month target concurrent <100 × 10% ≈ 10), floor 50 VU per aturan template → **50 VU minimum**, durasi ≥2 menit, catat P95/P99/error rate.
- **Files to create / modify:** `docs/load-test-results.md` (baru)
- **Acceptance criteria:**
  - [ ] Stage 1 (10 VU/60s) selesai dengan error rate 0% terhadap `/api/ticker` & halaman statis
  - [ ] Stage 2 (≥50 VU/≥2 menit) selesai dengan P95/P99 tercatat, memory di endpoint layer akhir ≤120% dari awal, nol error 5xx selama deploy pertengahan-tes (kalau deploy disimulasikan bersamaan)
- **Dependencies:** Task #023
- **Decisions made:** (fill after execution — never leave blank)

#### Task #025 — Validate Health Endpoint In Staging
- **Phase:** Phase 7 — Deployment
- **Scope:** Verifikasi `GET /api/health` di lingkungan staging/preview berperilaku benar dalam kondisi normal maupun terdegradasi.
- **Files to create / modify:** tidak ada file kode
- **Acceptance criteria:**
  - [ ] `GET /api/health` di preview mengembalikan `200`/`{status:"ok"}` dalam kondisi normal
  - [ ] Skenario KV terdegradasi (disimulasikan) tercermin di response tanpa membuat endpoint lain (mis. `/api/ticker`) ikut crash
- **Dependencies:** Task #008, Task #023
- **Decisions made:** (fill after execution — never leave blank)

#### Task #026 — Test Backup Restore In Staging
- **Phase:** Phase 7 — Deployment
- **Scope:** Uji sekali alur restore dari `backups/ticker-messages.json` kembali ke KV (proses manual — belum ada endpoint restore otomatis, sengaja di luar scope Task #012).
- **Files to create / modify:** `docs/backup-restore-runbook.md` (baru)
- **Acceptance criteria:**
  - [ ] Konten `backups/ticker-messages.json` berhasil ditulis kembali ke KV staging lewat `wrangler kv key put` (atau setara), diverifikasi lewat `GET /api/ticker`
  - [ ] Langkah restore didokumentasikan cukup detail untuk dijalankan orang lain saat insiden nyata, tanpa perlu tanya developer
- **Dependencies:** Task #014
- **Decisions made:** (fill after execution — never leave blank)

#### Task #027 — Generate & Verify API Documentation
- **Phase:** Phase 7 — Deployment
- **Scope:** Hasilkan `docs/api.yaml` (OpenAPI ringan) untuk 4 endpoint (`knowledge.md` §5), verifikasi terhadap server yang benar-benar jalan (bukan cuma ditulis manual dari ingatan).
- **Files to create / modify:** `docs/api.yaml` (baru)
- **Acceptance criteria:**
  - [ ] `docs/api.yaml` mencakup 4 endpoint dengan skema request/response `{ data, error }` dan `{ code, message }` sesuai `knowledge.md` §5
  - [ ] Tiap endpoint di dokumen diuji manual sekali terhadap server preview, response aktual cocok dengan skema yang didokumentasikan
- **Dependencies:** Task #012
- **Decisions made:** (fill after execution — never leave blank)
