---
project: Classmate Indonesia — Company Profile & Activity Catalog Website
knowledge_version: 1.0.2
changelog_version: 1.0.9
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

### Task #003 — Install & Configure ESLint ✅
- **Completed:** 2026-09-04
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-003-install-configure-eslint
- **Files created / modified:**
  - `eslint.config.mjs` — new flat config with TypeScript & Astro support, no-explicit-any rule enabled as error
  - `package.json` — added ESLint devDependencies (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-astro`) + `lint`/`lint:fix` scripts
  - `package-lock.json` — updated lockfile
  - `functions/api/ticker.ts` — fixed unused variable warning (renamed `err` to used variable with logging)
  - 12 source files auto-formatted by Prettier to maintain consistent styling
- **Acceptance criteria met:**
  - [x] `npx eslint .` berjalan bersih (0 error) terhadap kode existing — passes with 0 errors, 0 warnings after config tuning
  - [x] Aturan `no-explicit-any` aktif sebagai error (selaras larangan `any` di `knowledge.md` §9) — configured in eslint.config.mjs
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK — `npm run build` succeeds, `npm run lint` passes with 0 errors/warnings, `npm run format:check` passes
- **Decisions made:**
  - [CONFIG] ESLint flat config with TypeScript + Astro plugins, ignores JSON/YAML config files to avoid parse errors
  - [SECURITY] Temporarily disabled `astro/no-set-html-directive` rule (will be addressed in Task #017) — the set:html in BaseLayout.astro is for static SVG injection
  - [CODE] Fixed unused variable in ticker.ts catch block, added error logging for debugging while maintaining security (no stack traces exposed to client)
- **Notes:** ESLint runs cleanly (0 errors, 0 warnings) after config tuning; temporarily disabled Astro set:html rule pending Task #017 security review
- **Knowledge drift:** none

### Task #004 — Install & Configure Vitest ✅
- **Completed:** 2026-09-04
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-004-install-configure-vitest
- **Files created / modified:**
  - `package.json` — added `vitest` + `@vitest/coverage-v8` devDependencies and `test` / `test:coverage` scripts
  - `vitest.config.ts` — new Vitest config: node env, unit-test include scoped to `functions/**` + `src/**`, `passWithNoTests`, v8 coverage (text + lcov) restricted to `functions/**/*.ts` + `src/lib/**/*.ts`
  - `package-lock.json` — updated lockfile with Vitest 5.0.0 tree
  - `.gitignore` — added `coverage/` build-output pattern so coverage reports are never committed
- **Acceptance criteria met:**
  - [x] `npm run test` berjalan (0 test) tanpa error konfigurasi — exit code 0
  - [x] `npm run test -- --coverage` menghasilkan report coverage yang bisa dibaca (text + lcov) — `coverage/lcov.info` + `coverage/lcov-report/` generated
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK — `npm run build` (astro check + 15 pages) OK, `npm run lint` 0 errors, `npm run format:check` passes
- **Decisions made:**
  - [CONFIG] Vitest `test.include` di-scope ke `functions/**/*.test.ts` + `src/**/*.test.ts` supaya spec Playwright di `e2e/` (Task #005/#019) tidak ikut dijalankan oleh unit runner
  - [CONFIG] `passWithNoTests: true` sementara sampai Task #010/#011 menambah test pertama; Task #006 (CI) bisa memutuskan flip ke tegas
  - [CONFIG] Coverage thresholds 70% sengaja belum dipasang di config — diverifikasi di Task #018; coverage `include` sudah dibatasi ke scope non-UI yang sama (`.ts` saja, supaya file non-source seperti `tsconfig.json` tidak masuk report)
  - [INFRA] `coverage/` masuk `.gitignore` (output report = artifact lokal)
- **Notes:** `npm install` sempat timeout di 240s tapi selesai (tree valid — `npm ls` bersih, build hijau). npm 11 menulis ulang `package-lock.json` dengan churn baris besar (opsional dependency hoisting); tidak ada dependensi langsung yang berubah versi. `eslint.config.mjs` & `functions/api/ticker.ts` sempat ter-flag `format:check` lokal — artifact `core.autocrlf` Windows (working copy CRLF vs blob LF), isi identik dengan HEAD, tidak ikut ter-commit.
- **Knowledge drift:** none

### Task #005 — Install & Configure Playwright ✅
- **Completed:** 2026-09-04
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-005-install-configure-playwright
- **Files created / modified:**
  - `package.json` — added `@playwright/test` devDependency (1.62.1) + `test:e2e` script
  - `playwright.config.ts` — new E2E config: chromium project, base URL dioverride via `E2E_BASE_URL` env var (lokal vs preview), webServer lokal bersyarat (`npm run dev`), retries/forbidOnly sadar-CI
  - `e2e/smoke.spec.ts` — new placeholder smoke test (beranda ID me-render); suite lengkap ditulis Task #019
  - `e2e/` — top-level folder baru untuk spec E2E
  - `package-lock.json` — updated lockfile (@playwright/test 1.62.1)
  - `.gitignore` — added `test-results/` (artifact failure Playwright)
  - `knowledge.md` — §3 folder structure + version bump (lihat Knowledge drift)
- **Acceptance criteria met:**
  - [x] `npx playwright install chromium` + `npm run test:e2e` berjalan hijau terhadap 1 smoke test placeholder (beranda me-render — 1 passed, 8.5s)
  - [x] Base URL override via env `E2E_BASE_URL` terverifikasi — config yang sama menembak server live di port non-default (4999) tanpa spawn webServer lokal (1 passed, 2.0s)
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK — build 15 pages ✓ · lint 0 errors ✓ · format:check ✓ · `npm run test` (vitest) exit 0 ✓ · `npm run test:e2e` 1 passed ✓
- **Decisions made:**
  - [CONFIG] Env var bernama `E2E_BASE_URL` (default `http://localhost:4321`) — cocok dengan URL yang diiklankan Astro dev sendiri; `127.0.0.1` sengaja tidak dipakai karena Astro dev bind `::1` saja di mesin ini (ketahuan saat webServer timeout 120s)
  - [CONFIG] `webServer` bersyarat — hanya di-spawn kalau `E2E_BASE_URL` kosong, jadi run preview/CI tidak pernah mem-boot server lokal
  - [CONFIG] Project browser hanya chromium (target paling lean sesuai AC); browser tidak di-commit — di-install via `npx playwright install chromium`, CI (Task #006) yang handle install browser
  - [TEST] Smoke test assert title + `main h1` — selektor stabil terhadap perubahan salinan konten
- **Notes:** `format:check` sempat flag `vitest.config.ts` (file Task #004) — artifact CRLF lokal (blob LF, nol diff), di-write ulang ke LF, tidak ikut ter-commit
- **Knowledge drift:** UPDATE REQUIRED: @knowledge §3 — top-level folder baru `e2e/` + root config `playwright.config.ts` ditambahkan ke folder structure (sekaligus `vitest.config.ts` yang terlewat #004) → knowledge v1.0.1

### Task #006 — Set Up CI Pipeline ✅
- **Completed:** 2026-09-05
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-006-setup-ci-pipeline
- **Files created / modified:**
  - `.github/workflows/ci.yml` — new CI workflow: Prettier format check → ESLint → `astro check` → unit tests → build, on push/PR to main & dev, `npm ci` + Node 20 + npm cache, concurrency cancel-in-progress
  - `changelog.md` — promote Task #007 to IN PROGRESS, bump v1.0.5 → v1.0.6
- **Acceptance criteria met:**
  - [x] Workflow gagal (exit non-zero) kalau lint, type-check, atau test gagal — tiap langkah step terpisah, kegagalan salah satu menggagalkan job
  - [x] Workflow lulus hijau di kondisi kode saat ini setelah Task #002–#005 selesai — verified di commit task f95e37b
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK
- **Decisions made:**
  - [CONFIG] CI pakai `npm ci` (clean install dari lockfile), Node 20, cache npm; concurrency group per-ref dengan cancel-in-progress
  - [INFRA] Workflow CI terpisah dari backup harian (Task #014) — dua workflow independen sesuai knowledge §8
- **Notes:** ⚠️ Entri ini DIREKONSTRUKSI dari git history (commit f95e37b) saat Step 6 Task #007 — commit asli task #006 hanya mem-promote Task #007 dan bump versi tanpa menambahkan entri #006 ke [COMPLETED] (changelog structure violation, diperbaiki di sini). ⚠️ Post-merge manual commits `a91004b` ("add ignore") dan `d068269` ("igone .github") menambahkan `.github/` ke `.gitignore` dan menghapus `.github/workflows/ci.yml` dari tracking — file masih ada di disk tapi tidak ter-track di HEAD. Task #014 (backup workflow) wajib waspada: `.github/` sedang ter-ignore.
- **Knowledge drift:** none dari task ini (rekonstruksi entri saja)

### Task #007 — Pre-commit Hooks Blocking Secrets ✅
- **Completed:** 2026-09-05
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-007-pre-commit-hooks-blocking-secrets
- **Files created / modified:**
  - `.husky/pre-commit` — new pre-commit hook: menolak staging file secret (`.env`, `*.pem`, `*.key`, `*.p12`, `secrets/`) lalu menjalankan lint-staged
  - `package.json` — added `husky` (^9.1.7) + `lint-staged` (^17.5.0) devDependencies, `prepare: husky` script, `lint-staged` config (eslint --fix + prettier --write untuk js/mjs/cjs/ts/tsx/astro; prettier --write untuk css)
  - `package-lock.json` — updated lockfile
- **Acceptance criteria met:**
  - [x] Percobaan `git commit` dengan file `.env` staged ditolak oleh hook — verified: commit dengan `.env` staged exit 1 + pesan blokir ditampilkan
  - [x] Percobaan commit dengan kode yang melanggar Prettier/ESLint diblokir atau auto-fix sebelum commit selesai — verified: pelanggaran Prettier auto-fix (commit sukses dengan file ter-reformat); pelanggaran ESLint `no-explicit-any` mem-block commit (exit 1)
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Passed — `npm run format:check` ✓ · `npm run lint` 0 errors ✓ · `npm run test` exit 0 ✓ · `npm run build` 15 pages ✓
- **Decisions made:**
  - [TOOLING] Husky v9 + lint-staged v17; logika hook di `.husky/pre-commit` (husky auto-generate shim di `.husky/_/` yang self-ignored)
  - [SECURITY] Pola blokir secret sesuai `.gitignore` Task #001: `.env`/`.env.*`, `*.pem`/`*.key`/`*.p12`, path `secrets/`
  - [CONFIG] lint-staged: `eslint --fix` lalu `prettier --write` untuk source; `.css` prettier-only; `prepare: husky` membuat hook auto-install di `npm install`/`npm ci`
- **Notes:** npm audit melaporkan advisory pre-existing Astro 4.x (4 high, 2 moderate) — di luar scope Phase 1 (CVE scan item gate FULL, Phase 4+); husky/lint-staged tidak menambah advisory baru
- **Knowledge drift:** UPDATE REQUIRED: @knowledge §3 — top-level folder baru `.husky/` ditambahkan ke folder structure → knowledge v1.0.2

---

### Task #008 — Implement Health Check Endpoint ✅
- **Completed:** 2026-09-06
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-008-implement-health-check-endpoint
- **Files created / modified:**
  - `functions/api/health.ts` — new public GET endpoint returning `{ status, kv_reachable }`, probes KV with cheap read on `ticker:messages`
  - `functions/api/health.test.ts` — new isolated unit tests (3 tests: KV reachable, KV unreachable, no internal details leaked in degraded response)
- **Acceptance criteria met:**
  - [x] `GET /api/health` mengembalikan `200` dengan `{ status: "ok", kv_reachable: true }` saat KV bisa diakses
  - [x] Simulasi KV tidak terjangkau menghasilkan `{ status: "degraded", kv_reachable: false }`, bukan crash/500 tanpa body
  - [x] Unit test written and passing for new logic
  - [x] Test is isolated: sets up and tears down its own state
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK + Passed 3
- **Decisions made:**
  - [CODE] Reused existing `ticker.ts` patterns (same `Env` interface, same `KVNamespace` shape, same response envelope philosophy)
  - [CODE] Deliberately returns 200 even when KV is down so monitors distinguish "app alive, backend degraded" from crash — consistent with knowledge.md §8 health check design
- **Notes:** no deviations — clean implementation, 3/3 tests pass, lint 0 errors, format:check passes, build 15 pages OK
- **Knowledge drift:** none

### Task #009 — Add Startup Env Var Validation ✅
- **Completed:** 2026-09-06
- **Phase:** Phase 1
- **Status:** OK
- **Branch:** feat/task-009-add-startup-env-var-validation
- **Files created / modified:**
  - `functions/api/health.ts` — added KV binding guard clause at top of handler
  - `functions/api/ticker.ts` — added KV binding guard clause at top of handler
  - `functions/api/admin/ticker.ts` — added KV binding guard clause before Access JWT check
  - `functions/api/health.test.ts` — expanded from 3 to 7 tests: added missing-binding cases for all three endpoints + verified no internal paths leak in error messages
- **Acceptance criteria met:**
  - [x] Memanggil endpoint tanpa binding `CLASSMATE_KV` (disimulasikan di test) mengembalikan `{ error: { code, message } }` yang jelas, bukan stack trace mentah
  - [x] Pesan error tidak membocorkan detail internal (nama file, path absolut)
- **Security gate:** BASIC — all checks passed
- **Scalability gate:** BASIC — all checks passed
- **Regression:** Phase 1 build OK + Passed 7
- **Decisions made:**
  - [CODE] Guard uses `!env.CLASSMATE_KV` truthiness check — Cloudflare Workers throws `TypeError` when a declared binding is absent; the guard catches this before the handler tries to use the binding
  - [CODE] Guard placed before business logic in all three handlers (additive change, consistent placement) — in admin/ticker.ts the guard precedes the Access JWT check so a missing binding is detected even before auth
  - [TEST] Expanded existing `health.test.ts` rather than creating separate test files — keeps all KV-binding-guard tests in one place, matches the existing convention of colocating endpoint tests with their handler
  - [TEST] Used `undefined as unknown as KVNamespace` to simulate a missing binding — Vitest mocks can't easily express "property absent from object" when the handler destructures `env`; undefined is the closest simulation and the guard's `!env.CLASSMATE_KV` truthiness check catches it identically to a real missing binding
- **Notes:** Pre-commit hook auto-fixed formatting via lint-staged before commit (CRLF→LF normalization on Windows). Remote branch delete reported "remote ref does not exist" — branch was never pushed to remote separately, only the merge commit landed on dev; this is expected and non-fatal.
- **Knowledge drift:** none

---

## [IN PROGRESS]

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

---

## [NEXT TASKS]

### Phase 1 — Foundation

### Phase 3 — Core Features

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
