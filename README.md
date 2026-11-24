# Rafli Sahrul — Portfolio (`www.raflisahrul.my.id`)

Personal portfolio website for Rafli Sahrul, a Software and AI Engineer. The site uses an editorial layout and pre-built pages so everything loads quickly.

## About this project

The website has a main overview page with three selected projects (BrandMuse, muatmuat Plus, and RT Online), a complete project archive, and a custom error page for missing links. Page styling loads directly with each page so visitors see the finished layout right away.

Small scripts handle the interactive parts directly, so the browser does not have to load a large interface library. Visitors can copy Rafli's email address with one click and get immediate confirmation, open a compact menu on phones, and zoom in on architecture diagrams on smaller or touch screens. The zoom viewer only downloads when someone taps a diagram.

Built-in browser security rules block unauthorized scripts and keep other websites from embedding these pages. For speed, the site hosts trimmed-down copies of its own fonts (Inter and JetBrains Mono), saves assets in browser cache for return visits, prepares likely next pages in the background, and smooths out movement between pages. Project sections further down the page wait to load until you scroll to them.

## Tech Stack

| Layer                     | Technology                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Framework & Bundler       | Astro `7.4.12` (zero-framework client TypeScript), Vite `8.3.8`                                       |
| Styling & Fonts           | Tailwind CSS `4.3.5`, `@tailwindcss/vite`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono` |
| Language & Type Checking  | TypeScript `6.0.3` (`strict: true`), `@astrojs/check`                                                 |
| Linting & Formatting      | ESLint `10.15.0` (`@eslint/js`, `eslint-plugin-astro`, `typescript-eslint`), Prettier `3.10.1`        |
| Media & SEO               | `sharp`, `@astrojs/sitemap`, Schema.org `Person` JSON-LD                                              |
| Runtime & Package Manager | Bun `1.4.4`                                                                                           |
| Automated Verification    | Playwright (Chromium & WebKit), `axe-core`, `bun:test` (`HTMLRewriter`)                               |
| Hosting                   | Cloudflare Pages                                                                                      |

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
