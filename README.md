# Rafli Sahrul — Portfolio (`www.raflisahrul.my.id`)

Editorial personal portfolio for **Rafli Sahrul** (Software & AI Engineer), built as a static-first **Astro 7** site with **Svelte 5** Astro Islands, **Tailwind CSS v4**, strict **TypeScript**, and **Bun**.

## About This Project

- **Architecture:** Multi-page static build (`output: 'static'`, `inlineStylesheets: 'always'`) across `/` (overview with featured projects `BrandMuse`, `muatmuat Plus`, and `RT Online`), `/projects` (complete project archive), and `/404`.
- **Selective Client Interactivity (Astro Islands):** Only two lightweight Svelte 5 components hydrate on the client: `CopyEmail.svelte` (`client:idle`) for clipboard copying with live-region announcements, and `NavMenu.svelte` (`client:media`) which hydrates solely on compact phone viewports.
- **Security & Performance:** Build-time `SHA-256` Content Security Policy (`security.csp` in `astro.config.mjs`) covering every inline script and stylesheet without `'unsafe-inline'`, paired with `public/_headers` (`frame-ancestors 'none'`, strict security headers, and immutable caching for `/_astro/*`).
- **Accessibility & Responsive Layout:** Targets **WCAG 2.2 Level AA** with skip-link navigation, `44x44` CSS px coarse-pointer hit targets, Windows High Contrast (`forced-colors: active`) rules, safe-area inset tokens (`viewport-fit=cover`), and progressive two-segment foldable layout rules (`@media (horizontal-viewport-segments: 2)`).

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework & Islands | Astro `7.4.12`, Svelte `5.57.3` (`@astrojs/svelte`) | Static site generation and selective client islands |
| Styling & Fonts | Tailwind CSS `4.3.5`, `@tailwindcss/vite`, `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono` | Design tokens, layout utilities, self-hosted variable fonts |
| Language & Type Checking | TypeScript `6.0.3` (`strict: true`), `@astrojs/check`, `svelte-check` | Compile-time type safety across `.ts`, `.astro`, and `.svelte` |
| Media & SEO | `sharp`, `@astrojs/sitemap`, Schema.org `Person` JSON-LD | Optimized `AVIF`/`WebP` portrait builds, sitemap, Open Graph |
| Runtime & Package Manager | Bun `1.4.4` | Package installation, script execution, and test runner |
| Automated Verification | Playwright (Chromium & WebKit), `axe-core`, `bun:test` | Static HTML/CSS/CSP checks and browser/WCAG 2.2 AA E2E suite |
| Hosting | Cloudflare Pages | Static deployment with custom headers and redirects |

### Resolved Dependency Versions

| Package | Version |
|---|---|
| `astro` | `7.4.12` |
| `@astrojs/svelte` | `9.1.6` |
| `svelte` | `5.57.3` |
| `@astrojs/sitemap` | `3.7.5` |
| `@astrojs/check` | `0.9.12` |
| `typescript` | `6.0.3` (`@astrojs/check` requires TS 6; TS 7.0 is not yet supported by `astro check`) |
| `tailwindcss` | `4.3.5` |
| `@tailwindcss/vite` | `4.3.5` |
| `sharp` | `0.35.5` |
| `@fontsource-variable/inter` | `5.3.0` |
| `@fontsource-variable/jetbrains-mono` | `5.3.0` |
| `playwright` (dev) | `1.65.1` |
| `axe-core` (dev) | `4.14.0` |
| `svelte-check` (dev) | `4.7.8` |
| `@types/bun` (dev) | `1.4.4` |

## Design System

All visual tokens live in [`src/styles/global.css`](src/styles/global.css) (`@theme` and `:root`):

- **Monochrome Palette:**
  - `--color-canvas`: `#FFFFFF` (primary page background)
  - `--color-surface`: `#F4F4F4` (diagram panels and portrait frame backing)
  - `--color-inverse`: `#000000` (Contact footer surface and skip-link background)
  - `--color-ink`: `#0A0A0A` (primary text, `19.80:1` on canvas)
  - `--color-ink-secondary`: `#525252` (secondary metadata, `7.81:1` on canvas)
  - `--color-ink-inverse`: `#FFFFFF` (text on black, `21.00:1`)
  - `--color-ink-inverse-muted`: `#A3A3A3` (footer metadata, `8.33:1` on black)
  - `--color-rule`: `#E5E5E5` (`1px` structural dividers and header bottom border)
- **Typography:**
  - `--font-sans`: `Inter Variable` (display headings, prose, and navigation)
  - `--font-mono`: `JetBrains Mono Variable` (dates, indices, and diagram labels)
  - Fluid scales for `--text-hero`, `--text-section` (`clamp(2.25rem, 5vw, 4.25rem)`), `--text-body` (`1rem`, `1.6` line-height), and `--text-meta` (`0.875rem`, `1.5` line-height), with a responsive `.hero-wordmark` (`Rafli Sahrul` stacked below `40rem`, single full-width line at `40rem+`).
- **Spacing, Safe Areas & Controls:**
  - Shared horizontal container gutter `--spacing-gutter: clamp(1.25rem, 4vw, 3rem)` combined with `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` (`env(safe-area-inset-*, 0px)`).
  - Sharp `0px`-radius rectangular action buttons/links (`min-height: 44px`, `1px` border, solid `#0A0A0A` or `#FFFFFF` hover inversion), opaque surfaces with zero `backdrop-filter` or `position: fixed`, and `2px` focus outlines (`outline-offset: 3px`).
- **Three-Mode Navigation (CSS media queries in `em` units, `--nav-line: 2.75rem`):**
  - **Compact sticky** (`22.5em`–`39.99em` width, `>= 37.5em` height): sticky `44px` bar with native `<details>` `Menu` disclosure panel (`NavMenu.svelte`).
  - **Full sticky** (`>= 40em` width, `>= 37.5em` height): single-row inline navigation bar with `scroll-padding-top` clearance.
  - **Static fallback** (narrow `< 22.5em`, short landscape `< 37.5em`, or high zoom): static wrapping link row plus `Back to top` links in section running headers.

## Project Structure

```text
.
├── public/
│   ├── _headers                        # Cloudflare Pages security & cache headers
│   ├── favicon.svg                     # Site icon
│   ├── og-image.png                    # Open Graph preview image (1200x630)
│   └── robots.txt                      # Crawler rules & sitemap pointer
├── src/
│   ├── assets/
│   │   └── portrait.jpg                # Source portrait optimized at build time
│   ├── components/
│   │   ├── About.astro                 # Bio, portrait, focus, location, availability
│   │   ├── ArchitectureDiagram.astro   # Monochrome inline SVG architecture diagrams
│   │   ├── Certifications.astro        # Certifications list
│   │   ├── ContactFooter.astro         # Full-bleed black contact footer landmark
│   │   ├── CopyEmail.svelte            # Svelte 5 island for clipboard copy + live status
│   │   ├── Education.astro             # Education history
│   │   ├── Experience.astro            # Work experience timeline
│   │   ├── Hero.astro                  # First section with headline, links, wordmark
│   │   ├── NavMenu.svelte              # Svelte 5 island for compact <details> mobile menu
│   │   ├── ProjectArticle.astro        # Shared project card/case-study renderer
│   │   ├── Projects.astro              # Homepage featured projects + link to /projects
│   │   ├── RunningHeader.astro         # Section header with static-mode Back to top link
│   │   ├── SiteNav.astro               # Primary three-mode <header>/<nav> wrapper
│   │   └── TechStack.astro             # Staggered technical stack groups
│   ├── data/
│   │   ├── nav.ts                      # Strict TypeScript NavLink types & link builder
│   │   └── portfolio.ts                # Typed portfolio content & runtime assertions
│   ├── layouts/
│   │   └── BaseLayout.astro            # HTML shell, viewport, meta/OG/JSON-LD, skip link
│   ├── pages/
│   │   ├── 404.astro                   # Not-found page (/404)
│   │   ├── index.astro                 # Homepage (/)
│   │   └── projects.astro              # Complete project archive (/projects)
│   ├── styles/
│   │   └── global.css                  # Theme tokens, base rules, nav modes, foldables
│   └── env.d.ts                        # Astro TypeScript environment definitions
├── tests/
│   ├── browser.test.ts                 # Playwright (Chromium & WebKit) + axe-core suite
│   └── static.test.ts                  # Built dist/ HTML, CSS, CSP, and bundle checks
├── .bun-version                        # Pinned Bun version (1.4.4)
├── astro.config.mjs                    # Astro, Svelte, Tailwind, Sitemap & SHA-256 CSP
├── bunfig.toml                         # Enforces Bun runtime for CLIs
├── package.json                        # Scripts and dependencies
└── tsconfig.json                       # Strict TypeScript configuration
```

## Local Development (Bun only)

```sh
bun install
bun run dev
bun run check
bun run build
bun run preview
bun run test
```

- Runtime and package manager: **Bun** (pinned in `.bun-version` at `1.4.4`; `bunfig.toml` enforces `[run] bun = true` so framework CLIs run on Bun rather than Node).
- No `node`, `npm`, `npx`, `pnpm`, or `yarn` is required or invoked.

## Cloudflare Pages Deployment

### Build Settings
- **Framework preset:** Astro (or None)
- **Build command:** `bun run build`
- **Build output directory:** `dist`
- **Environment variables:** set `BUN_VERSION` to `1.4.4` (do **not** set `NODE_VERSION`)

### Custom Domain & Apex Redirect (`raflisahrul.my.id` -> `www.raflisahrul.my.id`)
1. Ensure the DNS zone for `raflisahrul.my.id` uses Cloudflare nameservers (required for proxied Redirect Rules).
2. In Cloudflare Dashboard under **Workers & Pages** -> your Pages project -> **Custom domains**, add `www.raflisahrul.my.id` (creates a proxied `CNAME` to `<project>.pages.dev`).
3. In DNS, add a proxied placeholder record for the apex `@` (`A` `192.0.2.1` or `AAAA` `100::`, proxied) if no origin record exists.
4. Create a **Single Redirect** rule (Rules -> Redirect Rules) matching `http.host eq "raflisahrul.my.id"` to `https://www.raflisahrul.my.id${http.request.uri.path}` with status `301` (Preserve query string enabled).
5. Optionally add a **Bulk Redirect** from `<project>.pages.dev/*` to `https://www.raflisahrul.my.id/$1` (301) in addition to the `X-Robots-Tag: noindex` header in `public/_headers`.

## Optional Assets (Omitted When Absent)

- `public/resume.pdf` — not present (the `Resume (PDF)` link is omitted; never copy `C:\Projects\assets\resume.pdf` directly as it contains private phone data).
- `public/og-image.png` (1200x630) — present (`og:image`, `twitter:image`, and `twitter:card="summary_large_image"` active).
- `src/assets/projects/` — no project screenshots added yet; architecture-heavy projects (`BrandMuse`, `RT Online`) render monochrome inline-SVG diagrams.

## Known Limitations Under Bun

- `bunx --bun playwright install chromium` failed on Windows because Playwright's `oopBrowserDownload.js` passes `@<absolute-path>` arguments that Bun's CLI interprets as a git package specifier (`error: "git clone" for "@C:/..." failed`). `tests/browser.test.ts` resolves this cleanly under Bun by falling back to system Chrome/Edge (`executablePath`).

## Manual Verification Checklist

- [ ] Inspect responsive layout and wordmark proportion at `320px`, `375px`, `768px`, `1280px`, `1440px`, and `1920px`.
- [ ] Verify keyboard-only navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`) from the skip link through `#contact`, confirming focus rings are visible and unobstructed on both `#FFFFFF` and `#000000` backgrounds.
- [ ] Verify 200% browser text zoom without clipping or horizontal overflow.
- [ ] Verify screen reader announcements (NVDA / VoiceOver / Narrator) for landmarks, heading hierarchy, external link cues, and the `Copy email` status live region.
- [ ] Verify `prefers-reduced-motion: reduce` disables entrance and hover transitions while keeping all content visible.
- [ ] Verify foldable / dual-screen layout (`@media (horizontal-viewport-segments: 2)`) in Chrome DevTools foldable/dual-screen emulation: confirm `.site-nav` stays in the left segment, the `#about` portrait and text sit on opposite sides of the hinge, and no body text, links, or buttons straddle the fold.
- [ ] Verify on the iPhone Duo simulator in Xcode with Safari's **Device Posture** and **Viewport Segments** feature flags enabled (`Settings -> Apps -> Safari -> Advanced -> Feature Flags`), across portrait/landscape and folded/unfolded widths (`382`–`951` CSS px) and heights (`368`–`902` CSS px), confirming outer-display strip background matches `#FFFFFF` and no content straddles the hinge.
