# Data Extraction Table — Rafli Sahrul Portfolio

Sources inspected:
1. `C:\Projects\assets\resume.pdf` (1 page)
2. `C:\Projects\assets\portfolio.pdf` (3 pages)
3. `C:\Projects\assets\portrait.jpg` (1 image)
4. Prompt §0 Owner-Provided Inputs

> Privacy rule (§3.2): Phone numbers (`+62 851-1755-5453`) are documented here solely to mark them **DO NOT PUBLISH** and must never appear in `src/`, `public/`, `dist/`, JSON-LD, meta tags, or comments.

---

## 1. Identity, Contact & Metadata

| Field | Extracted Value | Source File & Page | Status |
|---|---|---|---|
| Display Name | `Rafli Sahrul` | Prompt §0 (`DISPLAY_NAME`) | Found |
| Legal Name (`alternateName` only) | `Muhammad Rafli Sahrul Ramadhan` | `resume.pdf` p.1, `portfolio.pdf` p.1, Prompt §0 | Found (JSON-LD only) |
| Headline / Role | `Software & AI Engineer` | Prompt §0 (`HEADLINE`) | Found (differs from source summary phrasing — see Open Questions) |
| Source Summary Role Phrasing | `"Software Engineer with production experience in full-stack web development and AI/LLM engineering."` | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found (no standalone title line in PDFs) |
| City & Country | `Malang, East Java, Indonesia` (`portfolio.pdf` writes `Malang, Indonesia`) | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |
| Email | `rafliworkspace@gmail.com` | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |
| Phone Number | `+62 851-1755-5453` | `resume.pdf` p.1, `portfolio.pdf` p.1 | **EXCLUDED (Private §3.2)** |
| GitHub | `https://github.com/rflishrl` (`github.com/rflishrl`) | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |
| LinkedIn | `https://www.linkedin.com/in/rflishrl` (`linkedin.com/in/rflishrl`) | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |
| Other Public Handles (X, Telegram, etc.) | `not found` | `resume.pdf` p.1, `portfolio.pdf` p.1 | `not found` |
| Availability | `Open to freelance projects and full-time roles` | Prompt §0 (`AVAILABILITY_TEXT`) | Found |
| Current Focus (derived from sources) | Full-stack web systems and production AI/LLM engineering (RAG, multi-agent workflows) | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |
| Portrait Image | `C:\Projects\assets\portrait.jpg` (subject in dark patterned batik shirt, arms crossed, white background) | `portrait.jpg` | Found |
| Public Resume PDF (`public/resume.pdf`) | `not found` (source `resume.pdf` contains private phone number and must not be copied) | Prompt §0, §8 | `not found` |
| OG Image (`public/og-image.png`) | `not found` | Prompt §0, §8 | `not found` |

---

## 2. Profile Summary (Grounded Source Material)

| Field | Extracted Value | Source File & Page | Status |
|---|---|---|---|
| Professional Summary / Profile | Software Engineer with production experience in full-stack web development and AI/LLM engineering. Proficient in TypeScript/JavaScript (Next.js, React, Node.js), PHP (Laravel), and Python (FastAPI), backed by PostgreSQL, MySQL, Docker, and AWS. Experience building performant web apps, production RAG pipelines, and optimizing database queries and API response times. | `resume.pdf` p.1, `portfolio.pdf` p.1 | Found |

---

## 3. Experience

| Field | Extracted Value | Source File & Page | Status |
|---|---|---|---|
| **Role 1 — Organization** | `muatmuat` | `resume.pdf` p.1 | Found |
| Role 1 — Title | `AI Operator - Project Based (Contract, On-site)` | `resume.pdf` p.1 | Found |
| Role 1 — Dates | `Oct 2025 – Dec 2025` | `resume.pdf` p.1 | Found |
| Role 1 — Location | `Surabaya, East Java, Indonesia` | `resume.pdf` p.1 | Found |
| Role 1 — Bullets | 1. Engineered responsive web deliverables for muatmuat Plus (Domestic & International) using Next.js, TypeScript, and Tailwind CSS, aligning strictly with corporate design system.<br>2. Leveraged AI-assisted development tools (Cursor) to accelerate UI and API integration turnaround by ~35% while maintaining clean code standards.<br>3. Built automated end-to-end testing suites with Playwright and Katalon Studio, expanding regression test coverage and streamlining QA validation. | `resume.pdf` p.1 | Found |
| **Role 2 — Organization** | `PT. Virtus Technology Indonesia` | `resume.pdf` p.1 | Found |
| Role 2 — Title | `System Engineer (Contract, On-site)` | `resume.pdf` p.1 | Found |
| Role 2 — Dates | `May 2025 – Jul 2025` | `resume.pdf` p.1 | Found |
| Role 2 — Location | `South Jakarta, Jakarta, Indonesia` | `resume.pdf` p.1 | Found |
| Role 2 — Bullets | 1. Deployed and configured enterprise Trend Micro security solutions tailored to specific client infrastructure requirements.<br>2. Resolved L1/L2 technical support escalations, reducing average incident resolution time (MTTR) through proactive root-cause analysis.<br>3. Collaborated with presales engineering to formulate technical architecture proposals and client-tailored cybersecurity designs.<br>4. Authored technical documentation and led interactive training sessions for internal teams and enterprise end-users to drive product adoption. | `resume.pdf` p.1 | Found |
| **Role 3 — Organization** | `Merkle Innovation` | `resume.pdf` p.1 | Found |
| Role 3 — Title | `AI Engineer (Internship, Remote)` | `resume.pdf` p.1 | Found |
| Role 3 — Dates | `Nov 2024 – May 2025` | `resume.pdf` p.1 | Found |
| Role 3 — Location | `West Jakarta, Jakarta, Indonesia` | `resume.pdf` p.1 | Found |
| Role 3 — Bullets | 1. Architected a hybrid retrieval layer for an enterprise RAG system, combining dense vector embeddings with keyword search and metadata filtering for high-accuracy context retrieval.<br>2. Developed and deployed multi-agent conversational workflows utilizing LangChain, LangGraph, Flowise, Ollama, and DeepSeek.<br>3. Established document preprocessing pipelines for text extraction, layout normalization, and chunking across semi-structured datasets.<br>4. Implemented high-throughput Knowledge APIs and managed containerized hosting environments on AWS EC2 with 99.5%+ uptime. | `resume.pdf` p.1 | Found |
| **Role 4 — Organization** | `VENTURO` (written `Venturo Pro Indonesia` in `portfolio.pdf`) | `resume.pdf` p.1, `portfolio.pdf` p.2 | Found |
| Role 4 — Title | `Web Programmer (Internship, Remote)` | `resume.pdf` p.1 | Found |
| Role 4 — Dates | `Nov 2023 – Apr 2024` | `resume.pdf` p.1 | Found |
| Role 4 — Location | `Malang, East Java, Indonesia` | `resume.pdf` p.1 | Found |
| Role 4 — Bullets | 1. Led backend engineering for the RT Online application, enforcing clean MVC architecture and separation of concerns in Laravel (PHP).<br>2. Designed and documented RESTful API endpoints for Flutter mobile clients, ensuring low-latency data exchange and reliable payload handling.<br>3. Optimized MySQL database schemas and indexing strategies, reducing query latency and enhancing overall application throughput.<br>4. Developed modular, reusable Angular components based on UI/UX mockups, delivering a cohesive full-stack user experience. | `resume.pdf` p.1 | Found |

---

## 4. Education

| Field | Extracted Value | Source File & Page | Status |
|---|---|---|---|
| **Edu 1 — Institution** | `BINUS University` | `resume.pdf` p.1 | Found |
| Edu 1 — Program | `Bachelor of Science in Information Systems` | `resume.pdf` p.1 | Found |
| Edu 1 — Dates | `Aug 2026 – Present` | `resume.pdf` p.1 | Found |
| Edu 1 — Location | `not found` | `resume.pdf` p.1 | `not found` |
| Edu 1 — Honors / GPA / Coursework | `not found` | `resume.pdf` p.1 | `not found` |
| **Edu 2 — Institution** | `Telkom Vocational High School Malang` | `resume.pdf` p.1 | Found |
| Edu 2 — Program | `High School Diploma in Software Engineering` | `resume.pdf` p.1 | Found |
| Edu 2 — Dates | `Jul 2021 – Jun 2024` | `resume.pdf` p.1 | Found |
| Edu 2 — GPA | `87.52 / 100.00` | `resume.pdf` p.1 | Found |
| Edu 2 — Honors | `Finalist Moklet Idea Challenge 2023`; `Top 10 Playbox Season 2 Startup Comp` | `resume.pdf` p.1 | Found (`Startup Comp` truncated in source) |

---

## 5. Tech Stack (Grouped per §3.6)

| Category | Extracted Tools | Source File & Page | Status |
|---|---|---|---|
| **AI & LLM Engineering** | Retrieval-Augmented Generation (RAG), LangChain, LangGraph, Flowise, Ollama, DeepSeek, OpenAI, Gemini, Vector Search, pgvector, ETL Pipelines, Prompt Engineering, Langfuse, Pydantic, Cursor | `resume.pdf` p.1; `portfolio.pdf` p.1 | Found |
| **Frontend & Web** | TypeScript, JavaScript, React, Next.js, Angular, Vite, TanStack Start, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, HTML5, CSS3 | `resume.pdf` p.1; `portfolio.pdf` pp.1–3 | Found |
| **Backend & Runtime** | Python, FastAPI, PHP, Laravel, Node.js, Express.js, Java, Bun, RESTful APIs, WebSockets, Server-Sent Events (SSE), MVC Architecture, Zod | `resume.pdf` p.1; `portfolio.pdf` pp.1–3 | Found |
| **Data & Infrastructure** | PostgreSQL (Neon), MySQL, SQL, Docker, AWS (EC2), Cloudflare Pages, Cloudflare R2, Cloudflare Turnstile, Render, Git/GitHub, GitHub Actions, Linux/Unix, Playwright, Katalon Studio, Postman | `resume.pdf` p.1; `portfolio.pdf` pp.1–3 | Found |

---

## 6. Certifications

| Index | Title | Issuer | Date | Credential ID / Score | Source File & Page | Status |
|---|---|---|---|---|---|---|
| `01` | `IT Specialist in JavaScript` | `Certiport` | `not found` | `not found` | `resume.pdf` p.1 | Partial (date & ID missing) |
| `02` | `Junior Web Developer` | `BNSP` | `not found` | `not found` | `resume.pdf` p.1 | Partial (date & ID missing) |
| `03` | `Problem Solving (Basic/Intermediate)` | `HackerRank` | `not found` | `not found` | `resume.pdf` p.1 | Partial (date & ID missing) |
| `04` | `TOEIC` (`Test of English for International Communication`) | `not found` (subtitle given, issuer not printed) | `not found` | `not found` | `resume.pdf` p.1 | Partial (issuer, date & score missing) |

---

## 7. Projects (`portfolio.pdf`)

| Project | Role & Context | Grounded Facts (Problem / Solution / Metrics) | Tech Stack | URLs (`Source code` / `Live demo`) | Screenshots | Source File & Page | Status |
|---|---|---|---|---|---|---|---|
| **BrandMuse** | `AI Engineer, Personal Project` | AI brand assistant for creative teams answering questions on uploaded brand guidelines with page citations and generating 3 campaign concepts per brief. Hybrid retrieval (`pgvector` + PostgreSQL FTS via RRF) with `100% hit rate @5 on 18 test questions`, prompt-injection isolation, LangChain + Pydantic structured output retries, Gemini/OpenAI/Ollama provider layer over SSE, quotas/rate limits, Langfuse tracing, `98/100` Lighthouse accessibility. Deployed on Cloudflare Pages + Render (Docker), Neon PostgreSQL, Cloudflare R2, GitHub Actions. | Python, FastAPI, React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, LangChain, PostgreSQL (Neon), Cloudflare R2, pgvector, Gemini, OpenAI, Ollama, Langfuse, Docker | `not found` | `not found` | `portfolio.pdf` p.1 | Partial (URLs & screenshots missing) |
| **muatmuat International** | `AI Operator, Project Based` | B2B marketplace for heavy-vehicle spare parts connecting international buyers with mostly Chinese suppliers via subscription transactions. Built UI, UX, and API integrations (product listings, order management, subscriptions) on self-contained pages and coordinated shared layouts with frontend team. | AI-Assisted Development, Next.js, Tailwind CSS, RESTful API | `not found` | `not found` | `portfolio.pdf` p.1 | Partial (URLs & screenshots missing) |
| **muatmuat Domestic** | `AI Operator, Project Based` | Indonesian domestic marketplace for factory-direct spare parts from verified manufacturers. Implemented product catalog UI, checkout flows, seller dashboards, and API integrations (inventory, order tracking, authentication) and coordinated inter-page routing with frontend team. | AI-Assisted Development, Next.js, Tailwind CSS, RESTful API | `not found` | `not found` | `portfolio.pdf` p.2 | Partial (URLs & screenshots missing) |
| **RT Online** | `Web Programmer (Internship at Venturo Pro Indonesia)` | RESTful API and DevOps workflow in Laravel and MySQL for a community-level administration mobile app serving `over 1,000 active users`. Led backend team, managed deployment pipeline and environment config, optimized MySQL schema/queries, aligned API contracts with mobile team. | Laravel, MySQL, RESTful API | `not found` | `not found` | `portfolio.pdf` p.2 | Partial (URLs & screenshots missing) |
| **Desa Pendil Landing Page** | `Full Stack Developer` | Official public website for Desa Pendil (Banyuanyar, Probolinggo, East Java) for village news, public services, demographics, governance profiles, and photo gallery. Built landing, searchable/paginated news archive, detail, services, profile, and gallery pages; typed API client with Zod validation and 8s timeout, on-demand revalidation, semantic landmarks, skip link, self-hosted fonts. | TanStack Start, TanStack Router, React 19, TypeScript 5.9, Tailwind CSS, shadcn/ui, TanStack Query 5, React Hook Form, Zod 4, Neon PostgreSQL, Cloudflare Turnstile, Cloudflare R2, Bun | `not found` | `not found` | `portfolio.pdf` p.2 | Partial (URLs & screenshots missing) |
| **Sinar Berkah Landing Page** | `Full Stack Developer` | Public website for Sinar Berkah metal fabrication and laser cutting workshop in Malang, East Java. Built hero slider, services, materials, portfolio carousel, pattern gallery, Google Maps contact, live-search product catalog with WhatsApp ordering links, 6s timeout + retry API client, on-demand revalidation, unit & API contract tests, reduced-motion/forced-colors support, prioritized hero image. | TanStack Start, TanStack Router, React 19, TypeScript 5.9, Tailwind CSS, shadcn/ui, TanStack Query 5, React Hook Form, Zod 4, Neon PostgreSQL, Cloudflare Turnstile, Cloudflare R2, Bun | `not found` | `not found` | `portfolio.pdf` pp.2–3 | Partial (URLs & screenshots missing) |
