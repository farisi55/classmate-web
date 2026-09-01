# Classmate — Company Profile Website

Astro + Tailwind, static-first, deployed on Cloudflare Pages (100% free tier).
Full spec lives in `prd.md` and `knowledge.md` (not included in this zip — keep
them in your project docs repo as the source of truth).

## Status: Fase 1 lengkap, Fase 2 di-scaffold

**Fase 1 (selesai di project ini):** Beranda, Layanan, Aktivitas (38 item),
Klien & Venue, Syarat & Ketentuan, Tentang Kami, Kontak — semua dwibahasa
ID/EN. Running header tampil dengan pesan default statis (tidak butuh KV).

**Fase 2 (kode sudah ditulis, butuh setup Cloudflare untuk aktif):** endpoint
`/api/ticker` + `/api/admin/ticker` (Pages Functions) dan halaman `/admin`
sudah lengkap, tapi baru berfungsi penuh setelah kamu buat KV namespace &
pasang Cloudflare Access — langkah 4–5 di bawah. Sebelum itu, ticker tetap
tampil normal pakai pesan default (`src/data/ticker-defaults.ts`) — situs
tidak pernah rusak karena API belum di-setup.

## Yang masih perlu kamu lengkapi

Sebelum go-live publik, cek `ASSET_MANIFEST.md` untuk daftar lengkap — ringkasnya:
1. Font **Human Sans** (4 file `.woff2`) — belum ada, fallback ke `system-ui` sementara
2. Foto dokumentasi 38 aktivitas + hero — taruh di `src/assets/activities/` & `src/assets/hero/` (lihat konvensi nama file di `ASSET_MANIFEST.md`); placeholder aktif sampai foto asli ditambahkan
3. Testimoni asli (3 minimum, perlu consent form) — placeholder ditandai jelas di UI
4. Logo klien/venue asli — taruh di `src/assets/logos/{clients,venues}/` (opsional — tampil wordmark teks jika kosong)
5. Angka DP & batas waktu di halaman Syarat & Ketentuan (`[PLACEHOLDER]` di kode)
6. Lisensi font **Bolden Van** tidak jadi dipakai — sudah diganti Fredoka/Baloo 2 (aman, lihat knowledge.md)

## Development lokal

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # cek build production ke /dist
```

## Deploy ke Cloudflare Pages (100% gratis)

### 1. Push ke GitHub
```bash
git init && git add . && git commit -m "Initial Classmate website"
git remote add origin <repo-kamu>
git push -u origin main
```

### 2. Hubungkan ke Cloudflare Pages
Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
→ pilih repo ini. Build settings:
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `20`

Situs langsung live di `<nama-project>.pages.dev` — gratis, tanpa domain custom dulu,
sesuai keputusan di brief.

> Jika kamu menjalankan deploy secara manual dari repo, pakai `npm run deploy` atau
> `npx wrangler pages deploy dist`. Jangan gunakan `npx wrangler deploy` karena ini
> mencoba meng-deploy Worker entrypoint, bukan direktori Pages statis.

### 3. Buat KV namespace (untuk Fase 2)
```bash
npx wrangler kv namespace create CLASSMATE_KV
```
Salin `id` yang muncul dari perintah di atas ke `wrangler.toml`, ganti
`REPLACE_WITH_REAL_KV_NAMESPACE_ID`. Lalu di dashboard project Pages kamu →
**Settings → Functions** → tambahkan binding yang sama (KV: `CLASSMATE_KV`)
supaya berlaku di environment production Pages (wrangler.toml saja tidak
otomatis ke-pickup oleh Pages dashboard build).

> Tidak perlu bucket R2 — foto aktivitas & logo klien/venue di-commit ke
> `src/assets/` dan diproses otomatis (resize + WebP) oleh `astro:assets`
> saat build. Lihat `ASSET_MANIFEST.md` untuk konvensi nama file. Kalau
> project ini sebelumnya sudah punya bucket `classmate-assets` di dashboard
> Cloudflare, aman dihapus — tidak ada kode yang membacanya.

### 4. Isi KV dengan pesan ticker awal (sekali saja, manual)
```bash
npx wrangler kv key put --binding=CLASSMATE_KV "ticker:messages" \
  '[{"id":"promo-1","text_id":"...","text_en":"...","active":true,"priority":1}]'
```
Atau biarkan kosong — `/api/ticker` akan balas array kosong dan frontend tetap
pakai default statis sampai admin panel dipakai pertama kali.

### 5. Proteksi `/admin` dengan Cloudflare Access (gratis, s/d 50 user)
Dashboard Cloudflare → **Zero Trust** → **Access → Applications** → **Add an
application** → **Self-hosted** → domain: `<project>.pages.dev`, path: `/admin*`
(dan `/api/admin/*`) → policy: email kamu (OTP login, tanpa password custom).

### 6. (Nanti) Custom domain
Sesuai keputusan brief: pakai `*.pages.dev` dulu sampai situs disetujui, baru beli
domain dan hubungkan lewat **Custom domains** di dashboard project Pages.

## Struktur proyek
```
src/
  data/         # semua konten (paket, aktivitas, testimoni, klien/venue) — id/en berdampingan
  components/   # komponen Astro + islands React (Aktivitas filter, Admin form)
  layouts/      # BaseLayout (head, ticker, header, footer, WA button)
  pages/        # rute id (root) + rute en (/en/*)
functions/api/  # Cloudflare Pages Functions — GET /api/ticker, POST /api/admin/ticker
```

Untuk update konten paket/aktivitas/testimoni: edit langsung file di `src/data/*.ts`,
commit, push — Cloudflare Pages auto-redeploy. Untuk update pesan running header
sehari-hari: pakai `/admin` (Fase 2), tidak perlu redeploy.
