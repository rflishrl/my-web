# Rafli Sahrul — Portfolio (`www.raflisahrul.my.id`)

Editorial personal portfolio for **Rafli Sahrul** (Software & AI Engineer), built as a static-first **Astro 7** site with modular zero-framework **TypeScript** interactivity, **Tailwind CSS v4**, strict **TypeScript**, and **Bun**.

## About This Project

- **Architecture:** Multi-page static build (`output: 'static'`, `inlineStylesheets: 'always'`) across `/` (overview with featured projects `BrandMuse`, `muatmuat Plus`, and `RT Online`), `/projects` (complete project archive), and `/404`.
- **Zero-Framework Client Interactivity:** Lightweight bundled TypeScript `<script>` modules enhance native HTML controls with zero client-side UI framework runtime: `CopyEmail.astro` for clipboard copying with live-region feedback, `NavMenu.astro` for the compact phone popover menu, and SSR `ArchitectureDiagram.astro` SVGs that dynamically import `src/scripts/diagram-modal.ts` on demand only when zoomed on narrow or coarse-pointer viewports.
- **Security & Performance:** Build-time `SHA-256` Content Security Policy (`security.csp` in `astro.config.mjs`, with `base-uri 'none'` and `'inline-speculation-rules'`, without `'unsafe-inline'`), paired with `public/_headers` (`Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`, immutable caching for `/_astro/*`, and `Cache-Control` policies for icons, Open Graph image, `robots.txt`, and sitemaps). Uses Latin-only self-hosted font subsetting (variable `Inter Variable` + static 400-weight `JetBrains Mono`), `<script type="speculationrules">` (`eagerness: "moderate"`), cross-document `@view-transition` with `<link rel="expect" blocking="render">`, CSS `contain` isolation on `.diagram-dialog`, and `content-visibility: auto` on below-the-fold project articles.
- **Accessibility & Responsive Layout:** Targets **WCAG 2.2 Level AA** with skip-link navigation, `<meta name="text-scale" content="scale" />`, `<meta name="color-scheme" content="light" />`, `44x44` CSS px coarse-pointer hit targets, `aria-disabled` zoom controls with preserved keyboard focus, structured SVG `<figcaption>` descriptions, `scroll-target-group: auto` scrollspy (`IntersectionObserver` fallback), `prefers-contrast: more` scrollbar theming, Windows High Contrast (`forced-colors: active`) rules, safe-area inset tokens (`viewport-fit=cover`), and two-segment foldable layout rules (`@media (horizontal-viewport-segments: 2)`).

## Tech Stack

| Layer                     | Technology                                                                                            | Purpose                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Framework                 | Astro `7.4.12` (zero-framework client TypeScript)                                                     | Static site generation and minimal client enhancement           |
| Styling & Fonts           | Tailwind CSS `4.3.5`, `@tailwindcss/vite`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` | Design tokens, layout utilities, Latin-subset self-hosted fonts |
| Language & Type Checking  | TypeScript `6.0.3` (`strict: true`), `@astrojs/check`                                                 | Compile-time type safety across `.ts` and `.astro`              |
| Linting & Formatting      | ESLint `10.15.0` (`eslint-plugin-astro`, `typescript-eslint`), Prettier `3.10.1`                      | Flat-config static linting and Astro/CSS/TS formatting          |
| Media & SEO               | `sharp`, `@astrojs/sitemap`, Schema.org `Person` JSON-LD                                              | Optimized `AVIF`/`WebP` portrait builds, sitemap, Open Graph    |
| Runtime & Package Manager | Bun `1.4.4`                                                                                           | Package installation, script execution, and test runner         |
| Automated Verification    | Playwright (Chromium & WebKit), `axe-core`, `bun:test`                                                | Static HTML/CSS/CSP checks and browser/WCAG 2.2 AA E2E suite    |
| Hosting                   | Cloudflare Pages                                                                                      | Static deployment with custom headers and redirects             |

### Resolved Dependency Versions

| Package                        | Version                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `astro`                        | `7.4.12`                                                                               |
| `@astrojs/sitemap`             | `3.7.5`                                                                                |
| `@astrojs/check`               | `0.9.12`                                                                               |
| `typescript`                   | `6.0.3` (`@astrojs/check` requires TS 6; TS 7.0 is not yet supported by `astro check`) |
| `tailwindcss`                  | `4.3.5`                                                                                |
| `@tailwindcss/vite`            | `4.3.5`                                                                                |
| `sharp`                        | `0.35.5`                                                                               |
| `@fontsource-variable/inter`   | `5.3.0`                                                                                |
| `@fontsource/jetbrains-mono`   | `5.3.0`                                                                                |
| `eslint` (dev)                 | `10.15.0`                                                                              |
| `typescript-eslint` (dev)      | `8.73.0`                                                                               |
| `eslint-plugin-astro` (dev)    | `3.2.1`                                                                                |
| `eslint-config-prettier` (dev) | `10.1.8`                                                                               |
| `prettier` (dev)               | `3.10.1`                                                                               |
| `prettier-plugin-astro` (dev)  | `1.1.2`                                                                                |
| `playwright` (dev)             | `1.65.1`                                                                               |
| `axe-core` (dev)               | `4.14.0`                                                                               |
| `@types/bun` (dev)             | `1.4.4`                                                                                |

## Design System

All visual tokens live in [`src/styles/global.css`](src/styles/global.css) (`@theme`, `:root`, and `@layer components`):

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
  - `--font-mono`: `JetBrains Mono` (400-weight static Latin subset for dates, indices, and diagram labels)
  - Fluid scales using `rem + vw` formulas with `<= 2.5x` range caps for `--text-section` (`clamp(2.25rem, 1.35rem + 3vw, 4.25rem)`), `--text-display`, `--text-page-title`, `--text-body` (`1rem`, `1.6` line-height), and `--text-meta` (`0.875rem`, `1.5` line-height), with a responsive `.hero-wordmark` (`Rafli Sahrul` stacked below `40rem`, single full-width line across `40rem` and `64rem+` ranges).
- **Spacing, Safe Areas & Controls:**
  - Shared horizontal container gutter `--spacing-gutter: clamp(1.25rem, 0.5rem + 2.5vw, 3rem)` combined with `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` (`env(safe-area-inset-*, 0px)`).
  - Sharp `0px`-radius rectangular action buttons/links (`min-height: 44px`, `1px` border, solid `#0A0A0A` or `#FFFFFF` hover inversion, `.btn-frame` with `text-box: trim-both cap alphabetic`), opaque surfaces with zero `backdrop-filter` or explicit `position: fixed`, and `2px` focus outlines (`outline-offset: 3px`).
- **Three-Mode Navigation (CSS range media queries in `em` units, `--nav-line: 2.75rem`):**
  - **Compact sticky** (`22.5em <= width < 40em` and `height >= 37.5em`): sticky `44px` bar with native `<button popovertarget>` + `<ul popover="auto">` positioned via CSS Anchor Positioning (`anchor()` with `inset-block-start` fallback) (`NavMenu.astro`).
  - **Full sticky** (`width >= 40em` and `height >= 37.5em`): single-row inline navigation bar with `scroll-padding-top` clearance and active section scrollspy.
  - **Static fallback** (narrow `< 22.5em`, short landscape `< 37.5em`, or high zoom): static wrapping link row plus `Back to top` links in section running headers.

## Project Structure

```text
.
├── docs/
│   └── modern-web-audit-2026-11-20.md  # Modern Web Guidance audit report
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
│   │   ├── ArchitectureDiagram.astro   # SSR SVG architecture diagram & zoom trigger bootstrap
│   │   ├── Certifications.astro        # Certifications list
│   │   ├── ContactFooter.astro         # Full-bleed black contact footer landmark
│   │   ├── CopyEmail.astro             # Clipboard copy button + accessible live status
│   │   ├── Education.astro             # Education history
│   │   ├── Experience.astro            # Work experience timeline
│   │   ├── Hero.astro                  # First section with headline, links, wordmark
│   │   ├── NavMenu.astro               # Compact popover mobile menu + toggle/focus sync
│   │   ├── ProjectArticle.astro        # Shared project card/case-study renderer
│   │   ├── Projects.astro              # Homepage featured projects + link to /projects
│   │   ├── RunningHeader.astro         # Section header with static-mode Back to top link
│   │   ├── SiteNav.astro               # Primary three-mode <header>/<nav> wrapper + scrollspy
│   │   └── TechStack.astro             # Staggered technical stack groups
│   ├── data/
│   │   ├── nav.ts                      # Strict TypeScript NavLink types & link builder
│   │   └── portfolio.ts                # Typed portfolio content & runtime assertions
│   ├── layouts/
│   │   └── BaseLayout.astro            # HTML shell, viewport, meta/OG/JSON-LD, speculation rules, skip link
│   ├── pages/
│   │   ├── 404.astro                   # Not-found page (/404)
│   │   ├── index.astro                 # Homepage (/)
│   │   └── projects.astro              # Complete project archive (/projects)
│   ├── scripts/
│   │   └── diagram-modal.ts            # Lazy-loaded pan/zoom <dialog> controller
│   ├── styles/
│   │   └── global.css                  # Theme tokens, @layer components, nav modes, foldables
│   ├── utils/
│   │   └── date.ts                     # Shared Asia/Jakarta date formatter (SSR & client)
│   └── env.d.ts                        # Astro TypeScript environment definitions
├── tests/
│   ├── browser.test.ts                 # Playwright (Chromium & WebKit) + axe-core suite
│   └── static.test.ts                  # Built dist/ HTML, CSS, CSP, and bundle checks
├── .bun-version                        # Pinned Bun version (1.4.4)
├── .prettierignore                     # Prettier ignore rules
├── .prettierrc                         # Prettier configuration (Astro plugin)
├── astro.config.mjs                    # Astro, Tailwind, Sitemap & SHA-256 CSP
├── bunfig.toml                         # Enforces Bun runtime for CLIs
├── eslint.config.mjs                   # ESLint 10 flat config (TS, Astro, Prettier)
├── package.json                        # Scripts and dependencies
└── tsconfig.json                       # Strict TypeScript configuration
```
