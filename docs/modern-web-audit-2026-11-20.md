# Full Web Audit Report (`modern-web-guidance` & Best Practices)

- **Tanggal Audit**: 2026-11-20 (diperbarui 2026-11-21)
- **Branch / Commit Basis**: `main` (`4e70751`)
- **Versi `modern-web-guidance`**: `2026_11_10-47b4c80e` (`209` guide tersedia)
- **Hasil `legacy-scan src --json`**: `0` temuan di `38` guide deterministik (`52` rules, ~20% korpus)
- **Lingkup**: Audit statis seluruh source `src/`, `public/`, `astro.config.mjs`, hasil build `dist/`, dan rule `AGENTS.md` (`antislop` / `ponytail`)

---

## Ringkasan Kondisi Saat Ini (Hal yang Sudah Baik)

- **Arsitektur & Payload**: Static Astro output dengan stylesheet inline (`inlineStylesheets: 'always'`), tanpa third-party scripts/fonts, dan bundle island kecil (`DiagramViewer`: `7.79 KB`, `CopyEmail`: `1.44 KB`, `NavMenu`: `1.25 KB`, `client` helper: `0.98 KB`).
- **Kontras Warna (WCAG 2.x terhitung)**:
  - `#0A0A0A` di atas `#FFFFFF`: `19.80:1` (PASS AA)
  - `#525252` di atas `#FFFFFF`: `7.81:1` (PASS AA)
  - `#525252` di atas `#F4F4F4`: `7.10:1` (PASS AA)
  - `#0A0A0A` di atas `#F4F4F4`: `18.00:1` (PASS AA)
  - `#FFFFFF` di atas `#000000`: `21.00:1` (PASS AA)
  - `#A3A3A3` di atas `#000000`: `8.33:1` (PASS AA)
- **Stabilitas & Modal**: Sudah menggunakan `font-size-adjust: from-font`, `scrollbar-gutter: stable`, `overscroll-behavior: contain` pada `dialog:modal` & `dialog::backdrop`, `closedby="any"` + fallback pointer Safari pada `<dialog>`, serta `role="list"` pada list di luar `<nav>` untuk menjaga semantik di Safari.
- **CSP**: Strict hash-based CSP untuk `script-src` dan `style-src` via `security.csp` di [astro.config.mjs](../astro.config.mjs#L16-L34) tanpa `'unsafe-inline'`.

---

## Temuan Prioritas Tinggi

### 1. Potensi CLS di Hero pada `CopyEmail.svelte` (`hidden={!mounted}` + `client:idle`)

- **Lokasi**: [Hero.astro](../src/components/Hero.astro#L30-L37), [CopyEmail.svelte](../src/components/CopyEmail.svelte#L63-L65)
- **Guide Terkait**: `performance`, `content-first-noise-reduction`, `copy-button`
- **Masalah**:
  - `<CopyEmail client:idle />` ditempatkan di tengah baris tautan hero (`Email` -> `CopyEmail` -> `GitHub` -> `LinkedIn`).
  - Saat SSR, tombol dirender dengan `hidden={!mounted}` (`display: none`, lebar `0px`). Ketika `requestIdleCallback` berjalan dan komponen ter-hydrate, tombol tiba-tiba muncul dan mendorong tautan `GitHub` dan `LinkedIn` ke samping di area above the fold.
- **Rekomendasi**:
  - Hapus `hidden={!mounted}` dari `<button>` agar tata letak stabil sejak paint awal.
  - Gunakan `@media (scripting: none)` di CSS jika tombol ingin disembunyikan hanya ketika JavaScript benar-benar tidak aktif, atau ganti dengan script event-delegation ringan.

### 2. Hilangnya Fokus Keyboard di `DiagramViewer.svelte` & Spam `aria-live`

- **Lokasi**: [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L141-L150), [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L327), [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L332-L356)
- **Guide Terkait**: `accessibility`, `dialog`, `natural-interactions`
- **Masalah**:
  - Tombol `-` (`Zoom out`) dan `+` (`Zoom in`) memakai `disabled={scale <= MIN_SCALE}` / `disabled={scale >= MAX_SCALE}`. Ketika pengguna keyboard menaikkan atau menurunkan zoom sampai batas `50%` atau `300%`, elemen yang sedang difokuskan langsung menjadi `disabled` sehingga browser membuang fokus keluar dari tombol tersebut.
  - `<p aria-live="polite">{zoomPercent}%</p>` diperbarui pada setiap event `pointermove` (pinch) maupun `wheel`, berisiko membanjiri antrean pembaca layar.
  - `handleViewportPointerMove` memanggil `async setScaleCentered(...)` (`await tick()`) pada tiap `pointermove` tanpa coalescing per animation frame (`requestAnimationFrame`), berisiko memicu jitter perhitungan `scrollLeft`/`scrollTop` saat pinch cepat.
  - Belum ada `autofocus` eksplisit di kontrol utama dialog saat `showModal()` dipanggil.
- **Rekomendasi**:
  - Ganti `disabled` pada `-`/`+` dengan `aria-disabled` dan early return di `onclick` agar fokus keyboard tetap bertahan.
  - Debounce teks yang masuk ke region `aria-live` (hanya umumkan nilai akhir setelah jeda singkat atau klik tombol).
  - Throttle update pinch-zoom menggunakan `requestAnimationFrame`.
  - Tambahkan `autofocus` pada tombol utama modal (misalnya `Zoom in` atau `Close`).

### 3. Navigasi Mobile Memakai `<details>`/`<summary>` & Listener Window Manual

- **Lokasi**: [NavMenu.svelte](../src/components/NavMenu.svelte#L58-L71), [SiteNav.astro](../src/components/SiteNav.astro#L16-L29)
- **Guide Terkait**: `navbar`, `dialog`, `accessibility`, `html`
- **Masalah**:
  - Guide `navbar` dan `accessibility` secara eksplisit melarang pola `<details>`/`<summary>` untuk navigasi karena implementasi role `<summary>` tidak konsisten di screen reader (sering diumumkan sebagai "summary" atau "disclosure triangle", bukan kontrol menu).
  - `NavMenu.svelte` menangani penutupan secara manual lewat `<svelte:window onkeydown={handleKeydown} onpointerdown={handlePointerDown} />` dan `onfocusout`.
  - [SiteNav.astro](../src/components/SiteNav.astro#L16-L29) merender dua daftar `<ul>` terpisah (`.nav-full` dan `.nav-links` di `NavMenu.svelte`).
- **Rekomendasi**:
  - Ubah kontrol menu menjadi `<button type="button" popovertarget="..." aria-controls="...">Menu</button>` dan daftar menu menjadi `<ul popover="auto">` agar top layer native menangani `Escape`, light-dismiss, serta pemulihan fokus tanpa listener window manual.
  - Pertimbangkan penyatuan menjadi satu tree `<ul>` semantik apabila arsitektur `is-wide` + CSS Anchor Positioning diterapkan (dengan tetap menjaga fallback non-JS).

### 4. Rasio `clamp()` `.hero-wordmark` & Unit `vw` Murni pada Heading (WCAG 1.4.4 Resize Text)

- **Lokasi**: [global.css](../src/styles/global.css#L18-L26), [global.css](../src/styles/global.css#L189-L230), dan utilitas inline `text-[clamp(...)]` di [About.astro](../src/components/About.astro#L32), [Experience.astro](../src/components/Experience.astro#L12), [Education.astro](../src/components/Education.astro#L12), [TechStack.astro](../src/components/TechStack.astro#L20), [Certifications.astro](../src/components/Certifications.astro#L12), [ProjectArticle.astro](../src/components/ProjectArticle.astro#L24), [ContactFooter.astro](../src/components/ContactFooter.astro#L20), [projects.astro](../src/pages/projects.astro#L34), [404.astro](../src/pages/404.astro#L15)
- **Guide Terkait**: `responsive-design`, `typography`, `respect-os-text-scale`, `css`
- **Masalah**:
  - `.hero-wordmark` pada desktop memiliki rentang `3.25rem` hingga `23rem` (`7.08x`), jauh melampaui batas maksimal `2.5x` agar teks tetap dapat diperbesar hingga `200%` lewat browser zoom tanpa terhambat viewport.
  - Seluruh deklarasi `clamp()` memakai `vw` murni di argumen tengah (`5vw`, `6.5vw`, `7vw`, dan `calc(... * 0.1934)`) tanpa komponen berbasis `rem`, sehingga preferensi ukuran font root pengguna tidak ikut menskalakan ukuran di rentang fluid.
  - Token `--text-hero` dan `--text-section` di `@theme` ([global.css](../src/styles/global.css#L18-L26)) terdefinisi tetapi tidak pernah direferensikan di komponen.
- **Rekomendasi**:
  - Gunakan formula `rem + vw` di nilai tengah `clamp()` (misalnya `clamp(2.25rem, 1.5rem + 3vw, 4.25rem)`) dan sentralisasikan skala heading ke token CSS di `@theme`.
  - Evaluasi batas maksimum `.hero-wordmark` serta uji pembesaran teks `200%` pada berbagai lebar layar.

---

## Temuan Prioritas Sedang

### 5. Diagram SVG Tidak Terbaca Screen Reader & Belum Mendukung `forced-colors: active`

- **Lokasi**: [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L199-L274), [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L286-L310), [global.css](../src/styles/global.css#L584-L603)
- **Guide Terkait**: `accessibility` §6 (Complex images and charts), `color`
- **Masalah**:
  - `<svg role="img" aria-label={diagram.title}>` membungkus seluruh isi SVG sebagai satu gambar tunggal sehingga label node, sublabel teknologi, dan alur edge (`React + Vite Client`, `FastAPI Service`, `Hybrid Search`, dll.) tidak dapat dibaca oleh screen reader.
  - Elemen SVG di-hardcode memakai warna hex (`#0A0A0A`, `#525252`, `#FFFFFF`), dan blok `@media (forced-colors: active)` di [global.css](../src/styles/global.css#L584-L603) belum mengatur fallback `Canvas` / `CanvasText` untuk kotak node SVG, garis, panah, maupun border `.diagram-dialog`.
- **Rekomendasi**:
  - Tambahkan deskripsi teks terstruktur (misalnya daftar alur node/edge via `<figure>`/`<figcaption>` atau `aria-describedby` yang jelas).
  - Gunakan custom properties (`var(--color-ink)`, `var(--color-ink-secondary)`, `var(--color-canvas)`) serta aturan `@media (forced-colors: active)` pada kelas SVG diagram dan `.diagram-dialog`.

### 6. Belum Ada `<meta name="text-scale">` & `<meta name="color-scheme">` di `<head>`

- **Lokasi**: [BaseLayout.astro](../src/layouts/BaseLayout.astro#L59-L66), [global.css](../src/styles/global.css#L47)
- **Guide Terkait**: `respect-os-text-scale`, `dark-mode`, `antislop` R-21
- **Masalah**:
  - CSS sudah tidak menimpa `font-size` pada `html`/`:root` dan memakai unit relatif serta breakpoint `em`, namun belum memasang `<meta name="text-scale" content="scale" />` sehingga browser mobile pendukung (Chrome/Edge 146+) tidak menskalakan `1rem` mengikuti pengaturan teks OS.
  - `color-scheme: light;` sudah ada di CSS, tetapi `<meta name="color-scheme" content="light">` belum dipasang di `<head>` untuk menghindari flash canvas sebelum CSS diparse (atau `light dark` + `light-dark()` jika kelak menyediakan mode gelap).
- **Rekomendasi**: Tambahkan `<meta name="text-scale" content="scale" />` dan `<meta name="color-scheme" content="light">` di [BaseLayout.astro](../src/layouts/BaseLayout.astro#L64).

### 7. Tipografi Wrapping, Alignment Tombol, & `overflow-x: clip` pada `body`

- **Lokasi**: [global.css](../src/styles/global.css#L63-L72), [global.css](../src/styles/global.css#L288-L297)
- **Guide Terkait**: `improve-text-layout-and-legibility`, `form-factor-adaptation`, `precise-text-alignment`, `css-layout`
- **Masalah**:
  - Heading (`h2`, `h3`, `h4`) dan teks panjang (`p`, `li`) belum memakai `text-wrap: balance` maupun `text-wrap: pretty` untuk mencegah orphan.
  - `body { overflow-x: clip; }` ([global.css](../src/styles/global.css#L71)) bertentangan dengan aturan `form-factor-adaptation` agar tidak memotong overflow horizontal di level `html`/`body`.
- **Rekomendasi**:
  - Tambahkan `text-wrap: balance` pada `h2, h3, h4` (hindari `.hero-wordmark` dan `*`) serta `text-wrap: pretty` pada `p, li`.
  - Hapus `overflow-x: clip` dari `body` setelah memastikan `:where(a, code) { overflow-wrap: anywhere; }` dan seluruh kontainer fleksibel tidak meluber.
  - Pertimbangkan progressive enhancement `flex-wrap: balance;` setelah `flex-wrap: wrap;` pada `.nav-full`, serta `text-box: trim-both cap alphabetic;` pada label tombol berbingkai.

### 8. Pengerasan Security Headers HTTP, CSP `base-uri`, & Sanitasi JSON-LD

- **Lokasi**: [public/_headers](../public/_headers#L1-L14), [astro.config.mjs](../astro.config.mjs#L16-L34), [BaseLayout.astro](../src/layouts/BaseLayout.astro#L83-L85)
- **Guide Terkait**: `security`, `privacy`
- **Masalah**:
  - `astro.config.mjs` memakai `base-uri 'self'`; `security` §3.2 mewajibkan `base-uri 'none'` jika tag `<base>` tidak pernah digunakan.
  - [public/_headers](../public/_headers) belum mendefinisikan `Strict-Transport-Security`, `Cross-Origin-Opener-Policy` (`same-origin` atau `same-origin-allow-popups`), `Cross-Origin-Resource-Policy: same-origin` (dengan `cross-origin` untuk `/og-image.png` bila perlu), dan `focus-without-user-activation=()` di `Permissions-Policy`.
  - `JSON.stringify(jsonLd)` di `set:html` ([BaseLayout.astro](../src/layouts/BaseLayout.astro#L84)) belum men-escape karakter `<` menjadi `\u003c`.
  - `require-trusted-types-for 'script'` belum aktif; jika ingin diadopsi, wajib uji via `Content-Security-Policy-Report-Only` + `Reporting-Endpoints` dulu karena Svelte 5 menggunakan `template.innerHTML`.
- **Rekomendasi**: Ubah ke `base-uri 'none'`, escape `<` pada JSON-LD, dan lengkapi header keamanan di `public/_headers`.

### 9. Optimasi Portrait `sizes`/`decoding` & Subsetting Font

- **Lokasi**: [About.astro](../src/components/About.astro#L15-L25), [BaseLayout.astro](../src/layouts/BaseLayout.astro#L4-L5)
- **Guide Terkait**: `performance`, `optimize-image-priority`
- **Masalah**:
  - Portrait memakai `decoding="sync"` (memblokir main thread saat decode gambar ketika scroll) dan `sizes="(max-width: 1023px) 92vw, 420px"`. Pada viewport tablet (~900px), `92vw` memicu pemilihan varian `1080w` (`316.17 KB` JPG fallback / `51.76 KB` AVIF) padahal `.portrait-frame` dibatasi `max-w-[26rem]` (`416px`).
  - Impor `@fontsource-variable/inter` dan `@fontsource-variable/jetbrains-mono` menyertakan seluruh `14` aturan `@font-face` (`cyrillic`, `cyrillic-ext`, `greek`, `greek-ext`, `vietnamese`, `latin-ext`, `latin`) ke CSS inline di setiap halaman HTML.
- **Rekomendasi**: Ubah ke `decoding="async"` dan `sizes="(max-width: 1023px) min(92vw, 26rem), 26rem"`, serta impor hanya `/latin.css` dari paket `@fontsource-variable/*` jika situs murni berbahasa Inggris/ASCII.

### 10. Peluang MPA Performance & UX (`Speculation Rules`, View Transitions, `Scrollspy`, `content-visibility`)

- **Lokasi**: [BaseLayout.astro](../src/layouts/BaseLayout.astro), [SiteNav.astro](../src/components/SiteNav.astro), [global.css](../src/styles/global.css), [projects.astro](../src/pages/projects.astro)
- **Guide Terkait**: `improve-next-page-load-performance`, `cross-document-transitions`, `consistent-cross-document-transitions`, `scrollspy`, `defer-rendering-heavy-content`, `animate-to-from-top-layer`
- **Peluang**:
  - **Speculation Rules**: Menambahkan `<script type="speculationrules">` dengan `eagerness: "moderate"` untuk navigasi `/` <-> `/projects` (perhatikan kompatibilitas hash CSP Astro / `'inline-speculation-rules'`).
  - **Cross-Document View Transitions**: Menambahkan `@view-transition { navigation: auto; }` (dengan guard `@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }`) plus `<link rel="expect" href="#hero" blocking="render">` pada `/` dan `<link rel="expect" href="#projects-page-heading" blocking="render">` pada `/projects`.
  - **Scrollspy**: Memakai `scroll-target-group: auto` + `:target-current` + sinkronisasi `aria-current` pada `scrollend` (disertai fallback `IntersectionObserver`) untuk menandai section aktif di navigasi homepage.
  - **`content-visibility: auto`**: Menerapkan `content-visibility: auto` beserta `contain-intrinsic-block-size: auto <estimasi>` pada item kasus di bawah lipatan layar (terutama `/projects`), lalu memverifikasi urutan `Tab` keyboard melintasi batas off-screen.
  - **Top-Layer Modal Entry**: Menambahkan animasi masuk `@starting-style` ringan untuk `<dialog class="diagram-dialog">` (dijaga `prefers-reduced-motion`).

### 11. Kepatuhan `antislop` R-02 (Em Dash `—`) & State `:active` pada Kontrol Navigasi/Modal

- **Lokasi**: [BaseLayout.astro](../src/layouts/BaseLayout.astro#L19), [projects.astro](../src/pages/projects.astro#L15-L22), [Projects.astro](../src/components/Projects.astro#L13), [ProjectArticle.astro](../src/components/ProjectArticle.astro#L26), [404.astro](../src/pages/404.astro#L7), [portfolio.ts](../src/data/portfolio.ts#L113-L168), [global.css](../src/styles/global.css#L358-L371), [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L332-L364)
- **Guide Terkait**: `antislop` R-02 & R-39, `natural-interactions`
- **Masalah**:
  - Karakter em dash (`—`) masih dipakai pada `<title>`, running header (`01 — 03 Selected Works`), judul proyek (`{project.title} —`), dan rentang tanggal (`Oct 2025 — Dec 2025`). Di `antislop` R-02, em dash terlarang kecuali disetujui eksplisit oleh pemilik proyek lewat protokol konfirmasi R-37.
  - Link nav (`.nav-full a`, `.nav-links a`, `.nav-menu summary`, `.back-to-top a`) dan tombol kontrol modal diagram (`-`, `Reset`, `+`, `Close`) belum memiliki style `:active` tersendiri sebagai feedback tekan.

---

## Temuan Prioritas Rendah & Kebersihan Kode

### 12. Kelebihan `region` Landmark (`<section aria-labelledby>`)

- **Lokasi**: [About.astro](../src/components/About.astro#L8), [Experience.astro](../src/components/Experience.astro#L6), [Education.astro](../src/components/Education.astro#L6), [TechStack.astro](../src/components/TechStack.astro#L13), [Certifications.astro](../src/components/Certifications.astro#L6), [Projects.astro](../src/components/Projects.astro#L11), [projects.astro](../src/pages/projects.astro#L20)
- **Guide Terkait**: `accessibility` §1 (Landmarks)
- **Masalah**: Memberi `aria-labelledby` pada 6 `<section>` mengubah semuanya menjadi `region` landmark (~10 landmark per halaman bersama `banner`, `navigation`, `main`, `contentinfo`). `accessibility` menyarankan meminimalkan pelabelan `<section>` agar landmark utama tidak tenggelam dan navigasi heading (`<h2>`) lebih ringkas.

### 13. Perapian CSS Layer, Range Queries, Foldable Selectors, `CopyEmail`, `404`, & Tanggal Build

- **Cascade Layers**: Pindahkan aturan kustom di [global.css](../src/styles/global.css#L96-L581) ke `@layer components` agar prioritas cascade konsisten dengan Tailwind v4 (`css`).
- **Media Query Range & Unit Dinamis**:
  - Ganti `@media (min-width: 22.5em) and (max-width: 39.99em)` menjadi `@media (22.5em <= width < 40em)` untuk menutup celah `0.01em` pada zoom/DPR pecahan.
  - Ganti `max-height: calc(100svh - ...)` pada `.nav-links` terbuka ([global.css](../src/styles/global.css#L414)) menjadi `100dvh` (`css-layout` §7).
- **Selektor Foldable**: Ganti selektor berbasis struktur DOM seperti `#stack .container-editorial > div:last-child > div` ([global.css](../src/styles/global.css#L551)) dengan class semantik agar tidak rapuh bila markup berubah.
- **Konsistensi & Feedback `CopyEmail`**: Samakan label tombol (`"Copy email"` di [Hero.astro](../src/components/Hero.astro#L36) vs `"Copy"` di [ContactFooter.astro](../src/components/ContactFooter.astro#L50)), dan tampilkan feedback `"Copied"`/`"Copy failed"` di elemen `<span role="status">` terpisah alih-alih mengganti label/accessible name tombol itu sendiri (`copy-button`).
- **`<title>` Halaman 404**: Ubah `404 — Rafli Sahrul` ([404.astro](../src/pages/404.astro#L7)) menjadi lebih deskriptif seperti `Page not found | Rafli Sahrul` (`accessibility` §4).
- **Tanggal Build Statis**: `buildYear` dan `buildMonthYear` di [Hero.astro](../src/components/Hero.astro#L7-L13) dan [ContactFooter.astro](../src/components/ContactFooter.astro#L6-L10) dibekukan pada waktu build SSG (`November 2026`), sehingga terlihat statis apabila tidak ada redeploy berkala.

### 14. Scrollbar Theming, `prefers-contrast: more`, & `::selection`

- **Lokasi**: [global.css](../src/styles/global.css#L45-L93), [global.css](../src/styles/global.css#L133-L140)
- **Guide Terkait**: `customize-scrollbar-color-and-thickness`, `adapt-scrollbar-to-contrast-preferences`, `browser-ui-theming`
- **Temuan**:
  - Container scroll `.diagram-dialog-viewport` (`overflow: auto`) maupun halaman root belum mendefinisikan `scrollbar-color` (dengan kontras thumb terhadap track minimal `3:1`) serta override kontras tinggi `@media (prefers-contrast: more)` (misalnya `#000000` di atas `#FFFFFF`), padahal halaman memakai palet monokrom kontras tinggi dan overlay scrollbar transparan di macOS mengandalkan warna thumb yang jelas.
  - Belum ada gaya `::selection` yang disesuaikan untuk area terang maupun blok inverse `#contact` (`browser-ui-theming`).
- **Rekomendasi**:
  - Tambahkan token `--scrollbar-thumb` dan `--scrollbar-track` (>= `3:1`) menggunakan `scrollbar-color` dengan override `@media (prefers-contrast: more)` serta fallback `@supports not (scrollbar-color: auto)` bila menargetkan browser lama, tanpa menyetel `scrollbar-width: thin` (menjaga ukuran target thumb).
  - Tambahkan rule `::selection` pada root dan `#contact` agar tetap selaras dengan estetika monokrom.

### 15. Animasi Transform Individual, Kontrol Dialog Deklaratif, & Audit JS (`2026-11-21`)

- **Lokasi**: [global.css](../src/styles/global.css#L233-L254), [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L357-L363), [portfolio.ts](../src/data/portfolio.ts), [nav.ts](../src/data/nav.ts), [CopyEmail.svelte](../src/components/CopyEmail.svelte)
- **Guide Terkait**: `individual-transform-properties`, `dynamic-sibling-animations`, `declarative-dialog-popover-control`, `custom-button-actions`, `js`
- **Temuan**:
  - **Transform & Stagger**: `@keyframes hero-enter` memakai shorthand `transform: translateY(10px)` alih-alih individual transform property `translate: 0 10px` (Baseline Widely Available sejak Aug 2022) disertai base identity `translate: 0 0` jika diperlukan. Stagger `.hero-stagger-1..3` masih manual dengan class terpisah (`0ms`, `80ms`, `140ms`), meski wajar dipertahankan karena jeda non-linear.
  - **Dialog Close Control**: Tombol `Close` di [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L357-L363) masih mengikat handler `onclick={closeModal}`; dapat diganti ke `<form method="dialog">` atau `command="close"` apabila disederhanakan tanpa state `isOpen` JS (`declarative-dialog-popover-control`).
  - **Audit JavaScript/TypeScript (`js`)**: Seluruh client islands dan modul data (`CopyEmail.svelte`, `NavMenu.svelte`, `DiagramViewer.svelte`, `portfolio.ts`, `nav.ts`) teraudit bersih dari anti-pattern (`JSON.parse(JSON.stringify(...))`, `innerHTML = ''`, `document.createEvent()`, atau parsing query string manual).
  - **Solusi Standar Lintas Browser (Tanpa Fitur Eksperimental / Volatile)**: Untuk kebutuhan panning zoom diagram di [DiagramViewer.svelte](../src/components/DiagramViewer.svelte#L369-L381), styling underline di tautan, serta pembatasan koneksi di [astro.config.mjs](../astro.config.mjs#L22), perbaikan tetap menggunakan API standar lintas browser (`overflow: auto`, `touch-action`, `text-underline-offset`, dan CSP `connect-src 'self'`) tanpa API volatile.

---

### Modern Web Guidance Consulted

Seluruh temuan di dokumen ini diverifikasi terhadap `modern-web-guidance@2026_11_10-47b4c80e` via `list`, `legacy-scan`, dan `retrieve` atas guide: `html`, `css`, `css-layout`, `js`, `accessibility`, `performance`, `security`, `privacy`, `responsive-design`, `typography`, `color`, `dark-mode`, `browser-ui-theming`, `customize-scrollbar-color-and-thickness`, `adapt-scrollbar-to-contrast-preferences`, `respect-os-text-scale`, `fluid-scaling`, `size-aware-styling`, `precise-text-alignment`, `improve-text-layout-and-legibility`, `visually-stable-font-fallbacks`, `individual-transform-properties`, `dynamic-sibling-animations`, `dialog`, `light-dismiss-a-dialog`, `platform-controls-dismiss-dialog`, `declarative-dialog-popover-control`, `custom-button-actions`, `prevent-page-scroll-under-modal-dialog`, `animate-to-from-top-layer`, `copy-button`, `navbar`, `viewport-aware-dropdowns`, `scrollspy`, `state-aware-sticky-headers`, `accessible-generated-content`, `cross-document-transitions`, `consistent-cross-document-transitions`, `defer-rendering-heavy-content`, `optimize-image-priority`, `improve-next-page-load-performance`, `motion`, `natural-interactions`, `form-factor-adaptation`, `content-first-noise-reduction`, dan `validate-origins`. (Tiga guide berstatus volatile feature tanpa opt-in proyek, yaitu `2d-panning`, `custom-text-decorations`, dan `restrict-outbound-connections`, tidak diambil dan tidak digunakan.)
