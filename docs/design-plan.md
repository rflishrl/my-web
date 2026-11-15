# Design Plan — Rafli Sahrul Portfolio (`www.raflisahrul.my.id`)

> **Pass 1 Status:** Inspect, Extract, Plan only. No application code written yet. Waiting for owner review (`approved` or corrections).

---

## 1. Design Read & Liveliness Dials (antislop Part 3)

> Reading this as: `editorial personal portfolio` for `engineering hiring managers, founders, and technical teams`, in a `Swiss Neo-Grotesque monochrome editorial` style, dial `ENERGY 3 / RHYTHM 3 / MOTION 1`.

- **ENERGY 3 (Bold):** Full-width flush-bottom wordmark `Rafli Sahrul` on stark `#FFFFFF` canvas, followed by full-bleed `#000000` contact footer inversion (`07-contact.png`).
- **RHYTHM 3 (Asymmetric, mixed compositions):** Each section uses a distinct structural composition instead of repeating a template: edge-to-edge bottom-weighted hero (`01`) -> 12-col portrait/bio split (`02`) -> full-width ruled editorial rows (Experience/Education/Certifications) -> staggered typographic stack (`03`) -> giant two-line case-study headers with asymmetric `Task`/`Solution` micro-columns (`04`) and `#F4F4F4` showcase frames (`05`/`06`) -> black inversion CTA footer (`07`).
- **MOTION 1 (Hover states only + optional minimal CSS entrance):** Static by default with crisp hover color shifts and grayscale-to-color portrait transition strictly inside `@media (hover: hover)` and `@media (prefers-reduced-motion: no-preference)`. Zero endless loops, zero scroll-jacking.

---

## 2. Token System & Verified Contrast (§4A–C, R-25, R-31)

### A. Color Tokens (`@theme` in `src/styles/global.css`)

| Token | Hex | Purpose (R-31 one-line reason) | Contrast Check (computed via WCAG 2.x formula) |
|---|---|---|---|
| `--color-canvas` | `#FFFFFF` | Primary light background for maximum negative space matching `01`–`04` | Base |
| `--color-surface` | `#F4F4F4` | Neutral elevation field for portrait squircle and project showcase frames matching `02`/`05`/`06` | `1.10:1` vs canvas (decorative container only; never an interactive boundary) |
| `--color-inverse` | `#000000` | Full-bleed closing contrast inversion for Contact footer matching `07` | Base (dark) |
| `--color-ink` | `#0A0A0A` | Primary body copy, headlines, and interactive controls for stark legibility | `19.80:1` on canvas, `18.00:1` on surface (PASS AA) |
| `--color-ink-secondary` | `#525252` | Dates, locations, stack group labels, and metadata without competing with primary ink | `7.81:1` on canvas, `7.10:1` on surface (PASS AA) |
| `--color-ink-inverse` | `#FFFFFF` | Primary headings and links on the `#000000` contact canvas | `21.00:1` on inverse (PASS AA) |
| `--color-ink-inverse-muted` | `#A3A3A3` | Secondary metadata on `#000000` canvas while preserving AA normal-text legibility | `8.33:1` on inverse (PASS AA) |
| `--color-rule` | `#E5E5E5` | `1px` editorial row dividers separating experience, education, and certification entries | `1.26:1` on canvas (non-semantic divider only; interactive focus rings use `#0A0A0A` / `#FFFFFF` at >=19.8:1) |

- **Palette cap (R-29):** Monochrome neutral system only (0 chromatic accents; focal contrast achieved via scale, weight, and white-to-black inversion).

### B. Typography Tokens & Scale

- `--font-sans`: `'Inter Variable', 'Inter Fallback', system-ui, sans-serif` — Single neo-grotesque family matching the flat-cut vertical-stress display typography of the references without loading multiple text font families (R-06).
- `--font-mono`: `'JetBrains Mono Variable', ui-monospace, monospace` — Scoped strictly to years/date ranges, index numbers (`01`, `02`), and credential IDs for tabular alignment (R-06).
- **Fallback stability (`visually-stable-font-fallbacks`):** Use `font-size-adjust: from-font` (Baseline Jul 2024) on body/display containers, supplemented by `@font-face` metric overrides (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) if `@capsizecss/metrics` is retained.

| Scale Token | Value | Weight | Tracking | Line Height | Target Use |
|---|---|---|---|---|---|
| `--text-hero` | Desktop `>=sm`: `clamp(3.25rem, 12.2vw, 11.75rem)` (calibrated in Pass 2 to hit 97–100% width at 1280/1440/1920); Mobile `<sm`: `clamp(3.5rem, 24vw, 9rem)` | `700` | `-0.045em` | `0.86` | `<h1>` wordmark `Rafli Sahrul` |
| `--text-section` | `clamp(2.25rem, 5vw, 4.25rem)` | `700` (`300` on About line 2) | `-0.03em` | `1.05` | Section & case-study headings (`<h2>`, `<h3>`) |
| `--text-body` | `1rem` (`16px`) | `400` | `0` | `1.6` | Body prose (`max-w-[58ch]`, left-aligned, `hyphens: manual`) |
| `--text-meta` | `0.875rem` (`14px`) | `400` | `0` | `1.5` | Running headers, dates, stack labels, micro-column copy |

### C. Layout & Spacing Tokens

- `--spacing-gutter`: `clamp(1.25rem, 4vw, 3rem)` (~4% horizontal margin matching `01`–`07`).
- Container: `max-w-[120rem] mx-auto px-gutter`.
- Section vertical rhythm: `py-24 md:py-36` (half-scale on mobile so small viewports do not scroll through empty deserts per `antislop-layoutmobile`).
- Scroll offset: `scroll-margin-top: 2rem` on all `#section` anchors.

---

## 3. Responsive ASCII Wireframes

### Desktop (`>= 1280px`)

```text
+----------------------------------------------------------------------------------+
| Selected Works . 2026                               November 2026 . 05:25 WIB  |
| About   Experience   Education   Stack   Certifications   Projects   Contact     |
|                                                                                  |
|                                                                                  |
|                          (~50-55% open negative space)                           |
|                                                                                  |
|                                                                                  |
| Software & AI Engineer             Email  Copy email  GitHub  LinkedIn           |
| Rafli                   Sahrul                                                   |  <- 97-100% width, flush bottom
+----------------------------------------------------------------------------------+

[About #about]
+----------------------------------------------------------------------------------+
| Rafli Sahrul | Portfolio                                                About me |
|                                                                                  |
| +--------------------+        Hello!                                             |
| |                    |        I'm Rafli Sahrul                                   |
| |  Squircle Portrait |                                                           |
| |  (4:5, bg-surface) |        Paragraph 1 (<=55w)                                |
| |  ~33-38% width     |        Paragraph 2 (<=55w)                                |
| |                    |        Paragraph 3 (<=55w)                                |
| +--------------------+        Focus / Location / Availability                    |
+----------------------------------------------------------------------------------+

[Experience / Education / Certifications]
+----------------------------------------------------------------------------------+
| Rafli Sahrul | Portfolio                                              Experience |
| Experience                                                                       |
| -------------------------------------------------------------------------------- |
| Oct 2025 - Dec 2025     AI Operator - Project Based       - Bullet 1             |
| Surabaya, Indonesia     muatmuat                          - Bullet 2             |
| -------------------------------------------------------------------------------- |

[Stack #stack]
+----------------------------------------------------------------------------------+
| Rafli Sahrul | Portfolio                                       What I build with |
| What I build                                                                     |
| with?                                                                            |
| Short 2-3 sentence summary.                                                      |
|                                                                                  |
|        AI & LLM Engineering                Frontend & Web                        |
|        (staggered typographic list)        (offset baseline)                     |
|                                                                                  |
|                 Backend & Runtime                   Data & Infrastructure        |
|                 (offset horizontal)                 (offset baseline)            |
+----------------------------------------------------------------------------------+

[Projects #projects] (per article)
+----------------------------------------------------------------------------------+
| Rafli Sahrul | Portfolio                                    01 - 06 Selected Works |
| BrandMuse -                                                                 01   |
| AI Brand Assistant                                                               |
|                                                                                  |
| Task                         Solution                                            |
| <=45 words                   <=45 words (starts ~38% across)                     |
| Stack list / optional links                                                      |
| +------------------------------------------------------------------------------+ |
| |                  Centered showcase frame (bg-surface, rounded-24px)          | |
| +------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------+

[Contact #contact] (bg-inverse #000000, text #FFFFFF)
+----------------------------------------------------------------------------------+
| Rafli Sahrul | Portfolio                                           November 2026 |
|                                                                                  |
| Let's start                                                                      |
| something!                                                                       |
|                                                                                  |
|                                                                                  |
| GitHub                                              e-mail: rafliworkspace@...   |
| LinkedIn                                                                  [Copy] |
+----------------------------------------------------------------------------------+
```

### Mobile (`375px`)

```text
+-----------------------------------+
| Selected Works . 2026             |
| November 2026 . 05:25 WIB         |
| About  Experience  Education      |  <- 2-line wrapped nav, >=44px tap height
| Stack  Certifications  Projects   |
| Contact                           |
|                                   |
| (proportional upper whitespace)   |
|                                   |
| Software & AI Engineer            |
| Email  Copy email                 |
| GitHub  LinkedIn                  |
|                                   |
| Rafli                             |  <- 2 stacked lines, 0px overflow
| Sahrul                            |
+-----------------------------------+

[About #about]
+-----------------------------------+
| Rafli Sahrul | Portfolio | About  |
| +-------------------------------+ |
| | Squircle Portrait (4:5)       | |
| +-------------------------------+ |
| Hello!                            |
| I'm Rafli Sahrul                  |
| Bio paragraphs (left-aligned)     |
| Metadata strip (stacked)          |
+-----------------------------------+

[Experience / Education / Certs]
+-----------------------------------+
| --------------------------------- |
| Date & Location (mono)            |
| Role & Organization               |
| - Bullets                         |
| --------------------------------- |

[Stack #stack]
+-----------------------------------+
| What I build with?                |
| Intro summary                     |
| AI & LLM Engineering (ul)         |
| Frontend & Web (ul)               |
| Backend & Runtime (ul)            |
| Data & Infrastructure (ul)        |

[Projects #projects]
+-----------------------------------+
| 01  BrandMuse - AI Brand Assistant|
| Task                              |
| Solution                          |
| Tech stack list                   |
| [Showcase frame / Diagram]        |

[Contact #contact] (#000000)
+-----------------------------------+
| Rafli Sahrul | Portfolio          |
| November 2026                     |
| Let's start something!            |
|                                   |
| GitHub                            |
| LinkedIn                          |
| e-mail: rafliworkspace@gmail.com  |
| [Copy]                            |
+-----------------------------------+
```

---

## 4. Deliberate Deviations from Reference Screenshots

1. **Primary Navigation Bar (`01-hero.png`):** Added `<nav aria-label="Primary">` with 7 anchor links directly under the top bar (per §5.1) because a multi-section web portfolio requires direct section navigation, unlike static presentation slides.
2. **Wordmark & Name in Hero (`01-hero.png`):** Displays `Rafli Sahrul` instead of the generic word `Portfolio`, keeping the same bottom-flush monumental proportion.
3. **No Phone Number (`01-hero.png`, `07-contact.png`):** Omitted `+62 851-1755-5453` from all public views and metadata per §3.2 privacy rules.
4. **Ragged-Right Text (`02`, `04`):** Replaced justified, hyphenated text blocks with ragged-right (`text-align: left`, `hyphens: manual`) per §0 Rule 4 for web readability.
5. **Interactive Copy Button (`01`, `07`):** Added a progressive-enhancement `Copy email` / `Copy` button beside `mailto:` (hidden when JS is disabled, polite live-region announcement).
6. **Stack Section Grouping (`03-stack.png`):** Expanded the 6 loose terms into 4 semantic `<ul>` groups matching §3.6 while keeping the asymmetric staggered desktop layout without boxes or badges.
7. **Portrait Hover Color (`02-about.png`):** Grayscale by default to match the monochrome editorial aesthetic; transitions to full color on pointer hover only (`@media (hover: hover)` and `prefers-reduced-motion: no-preference`).
8. **Project Case-Study Height & Visuals (`04`–`06`):** Compressed vertical spacing compared to standalone slide `04` so readers do not scroll through empty screens on the web; uses architecture diagrams (or omits frames where pushed back) when real screenshots are absent.

---

## 5. Cliché & Anti-Slop Checklist (§4D + `antislop` Rules)

| Check / Rule | Status | Verification Notes |
|---|---|---|
| No SaaS cards / boxes / shadows (§4D, R-12, R-14) | PASS | Experience, Education, Stack, Certifications, Projects use open whitespace and `1px` `--color-rule` dividers only. |
| No badges, pills, or icons (§4D, R-04, R-09) | PASS | Tools render as plain typographic `<ul>` lists; no capsule badges, glowing dots, or decorative icon sets. |
| No headline word-styling (§4D) | PASS | No underlined, colored, or italicized words inside headings; About line 2 uses weight `300` on the whole line as specified. |
| Restrained motion (R-19, §6.3) | PASS | `MOTION 1`: hover responses + optional hero reveal inside `prefers-reduced-motion: no-preference`; zero loops. |
| Palette cap & contrast (R-25, R-29) | PASS | Monochrome tokens only; all text pairings verified >= 7.10:1 (`ink-secondary` on `surface`) to 21.00:1. |
| Real grounded content only (R-17, R-18, R-36, R-38) | PASS | All copy sourced strictly from `resume.pdf` and `portfolio.pdf`; missing fields omitted; metrics cited verbatim (`~35%`, `99.5%+`, `100% hit rate @5`, `98/100`, `1,000+`). |
| Specific active-voice CTAs (R-15, R-16) | PASS | No "Get Started / Learn More / Seamless / Cutting-Edge"; action links use `Email`, `Copy email`, `GitHub`, `LinkedIn`. |
| Em dash ban vs Reference rule (**R-02 vs R-37**) | **CONFLICT** | Prompt §3.5/§5.3/§5.7 and `04-case-study-title.png` use `—` in date ranges and project titles. Surfaced in Open Questions for owner decision before Pass 2. |

---

## 6. Open Questions & Ponytail Ultra Pushback

### A. Data & Asset Gaps (`not found` / Ambiguities)
1. **`HEADLINE` vs Resume phrasing (§0):** Prompt §0 sets `HEADLINE` to `Software & AI Engineer`. The resume/portfolio have no standalone headline line and open their summary with `"Software Engineer with production experience in full-stack web development and AI/LLM engineering."` Confirm keeping `Software & AI Engineer`.
2. **Em-dash conflict (`antislop` R-02 vs R-37):** The prompt specifies `—` in `YYYY — Present` (§3.5), `YYYY — YYYY` / `Month YYYY — Present` (§5.3), `01 — 0N Selected Works` (§5.7), and `[Project Title] — [Domain / System Type]` (§5.7, matching `04-case-study-title.png`). Under `antislop` R-02 (`—` forbidden) + R-37 (ask rather than silently keep or cut), should we **keep `—`** in those structural/typographic positions or replace them with en dash (`–`) / colon (`:`) / hyphen (`-`)?
3. **Missing Certification Metadata:** `resume.pdf` lists all 4 certifications without **dates, scores, or credential IDs**, and `TOEIC` lacks an explicit issuer name (`ETS` is not printed). Under §3.9 they will be omitted unless you provide them.
4. **Missing Project Links & Screenshots:** None of the 6 projects in `portfolio.pdf` include `Source code` URLs, `Live demo` URLs, or screenshot images. Will omit links and either use monochrome inline-SVG diagrams or real screenshots if you provide them.
5. **Truncated Honor Text:** In `resume.pdf`, Telkom Vocational High School's second honor reads `Top 10 Playbox Season 2 Startup Comp` (clipped at line wrap). Should this read `Startup Competition` or stay verbatim `Startup Comp`?
6. **Optional Files (`public/resume.pdf`, `public/og-image.png`):** Neither exists yet. Confirm omitting `Resume (PDF)` and `og:image` / `summary_large_image` until you supply public-safe files (without your phone number).
7. **NDA / Confidentiality Check (§3.2):** Confirm that `muatmuat`, `PT. Virtus Technology Indonesia`, `Merkle Innovation`, `VENTURO`, `Desa Pendil`, and `Sinar Berkah` are all cleared for public listing with no NDA restrictions.
8. **Location Format:** `resume.pdf` says `Malang, East Java, Indonesia`; `portfolio.pdf` says `Malang, Indonesia`. Which format do you prefer?

### B. `/ponytail ultra` Pushbacks (Questioning Unjustified Scope Before Pass 2)
1. **Live ticking JS clock (`clock.ts`):** `01-hero.png` only shows `Month YYYY`. A minute-aligned `setTimeout` + `visibilitychange` script adds client JS for no real user need. **Proposal:** Drop `clock.ts` and render static build-time `Month YYYY` (zero JS), unless you explicitly want the live `WIB` clock kept.
2. **6 Hand-Coded SVG Architecture Diagrams (`ArchitectureDiagram.astro`):** Drawing 6 separate inline SVGs for projects without screenshots (especially marketing/catalog sites like `Desa Pendil` and `Sinar Berkah`) adds large hand-maintained SVG markup and borders on decorative illustration (`antislop` R-22). **Proposal:** Render SVG diagrams only for backend/AI architecture projects (`BrandMuse`, `RT Online`), or omit showcase boxes when screenshots don't exist—unless you want all 6 kept per §5.7.
3. **Duplicate `muatmuat` Entries:** `muatmuat` appears in Experience and twice in Projects (`muatmuat International` and `muatmuat Domestic`, sharing identical tech stacks). **Proposal:** Confirm whether to keep all 6 projects separate or merge `muatmuat International` & `Domestic` into one combined case study.
4. **Skip Unneeded Scaffolding (`PortraitPlaceholder.astro`, `@capsizecss/metrics`):** Since `C:\Projects\assets\portrait.jpg` already exists, `PortraitPlaceholder.astro` is dead code from day one. Similarly, CSS `font-size-adjust: from-font` (Baseline 2024) handles fallback font metrics without needing `@capsizecss/metrics`. **Proposal:** Omit `PortraitPlaceholder.astro` and `@capsizecss/metrics` unless you need pre-2024 browser `@font-face` overrides.
