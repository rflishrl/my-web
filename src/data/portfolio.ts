export interface SocialProfile {
  label: string;
  url: string;
}

export interface ExperienceItem {
  organization: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  program: string;
  period: string;
  gpa?: string;
  honors?: string[];
}

export interface StackGroup {
  label: string;
  items: string[];
}

export interface CertificationItem {
  index: string;
  title: string;
  issuer?: string;
  subtitle?: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureDiagramData {
  title: string;
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ProjectItem {
  index: string;
  title: string;
  domain: string;
  featured?: boolean;
  role: string;
  task: string;
  solution: string;
  tech: string[];
  sourceUrl?: string;
  liveUrl?: string;
  diagram?: ArchitectureDiagramData;
}

export interface PortfolioData {
  displayName: string;
  legalName: string;
  headline: string;
  location: string;
  email: string;
  availability: string;
  currentFocus: string;
  portraitAlt: string;
  profiles: SocialProfile[];
  bio: [string, string, string];
  experience: ExperienceItem[];
  education: EducationItem[];
  stackIntro: string;
  stackGroups: StackGroup[];
  certifications: CertificationItem[];
  projects: ProjectItem[];
}

export const portfolio: PortfolioData = {
  displayName: 'Rafli Sahrul',
  legalName: 'Muhammad Rafli Sahrul Ramadhan',
  headline: 'Software & AI Engineer',
  location: 'Malang, East Java, Indonesia',
  email: 'rafliworkspace@gmail.com',
  availability: 'Open to freelance projects and full-time roles',
  currentFocus:
    'Full-stack web systems and production AI/LLM engineering (RAG and multi-agent workflows)',
  portraitAlt:
    'Portrait of Rafli Sahrul in a dark batik shirt, arms crossed, against a white background',
  profiles: [
    { label: 'GitHub', url: 'https://github.com/rflishrl' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rflishrl' },
  ],
  bio: [
    'I am a Software Engineer who builds full-stack web applications and production AI systems. My work spans JavaScript and TypeScript (Next.js, React, Node.js), PHP (Laravel), and Python (FastAPI), backed by PostgreSQL, MySQL, Docker, and AWS.',
    'In AI engineering, I build retrieval-augmented generation pipelines, hybrid vector and keyword search, document preprocessing workflows, and multi-agent systems using LangChain, LangGraph, Flowise, Ollama, and DeepSeek. I focus on accurate context retrieval and reliable runtime behavior.',
    'Across enterprise, agency, and independent projects, I have delivered RESTful APIs serving over 1,000 active users, SQL query optimizations, automated Playwright test suites, and accessible web portals.',
  ],
  experience: [
    {
      organization: 'muatmuat',
      role: 'AI Operator - Project Based (Contract, On-site)',
      period: 'Oct 2025 — Dec 2025',
      location: 'Surabaya, East Java, Indonesia',
      bullets: [
        'Built responsive UI components and cross-page flows for muatmuat Plus (Domestic and International) in Next.js, TypeScript, and Tailwind CSS to match the company design system.',
        'Used Cursor in daily development to help the frontend team ship UI pages and RESTful API integrations (product listings, order management, and subscriptions) faster with clean code.',
        'Wrote automated end-to-end tests in Playwright and Katalon Studio to catch regressions across key user flows before release.',
      ],
    },
    {
      organization: 'PT. Virtus Technology Indonesia',
      role: 'System Engineer (Contract, On-site)',
      period: 'May 2025 — Jul 2025',
      location: 'South Jakarta, Jakarta, Indonesia',
      bullets: [
        'Installed and configured enterprise Trend Micro security products for client environments with zero post-install defects, and worked with the presales team on technical architecture proposals.',
        'Resolved 40+ L1 and L2 support escalations and cut average incident resolution time (MTTR) by ~25% through root-cause analysis and internal documentation.',
      ],
    },
    {
      organization: 'Merkle Innovation',
      role: 'AI Engineer (Internship, Remote)',
      period: 'Nov 2024 — May 2025',
      location: 'West Jakarta, Jakarta, Indonesia',
      bullets: [
        'Built the hybrid retrieval layer for a production RAG system using vector search, keyword search, metadata filtering, and access controls so answers stay grounded in accurate context.',
        'Built and deployed multi-agent chatbot workflows with LangChain, LangGraph, Flowise, Ollama, and DeepSeek.',
        'Set up document preprocessing pipelines (layout processing, text normalization, metadata extraction, and semantic chunking) to turn semi-structured files into searchable RAG data.',
        'Built Knowledge APIs for AI agents to consume and ran containerized deployments on AWS EC2 with 99.5%+ uptime.',
      ],
    },
    {
      organization: 'VENTURO',
      role: 'Web Programmer (Internship, Remote)',
      period: 'Nov 2023 — Apr 2024',
      location: 'Malang, East Java, Indonesia',
      bullets: [
        'Led the backend team for the RT Online app and structured the Laravel (PHP) codebase around the MVC pattern to separate request handling from application logic.',
        'Designed and documented RESTful APIs for Flutter mobile clients with consistent contracts and reliable payload handling.',
        'Normalized MySQL schemas and tuned composite indexes and SQL queries to remove bottlenecks, speed up queries, and cut API response latency.',
        'Turned UI/UX mockups into reusable Angular components and wired them to the backend.',
      ],
    },
  ],
  education: [
    {
      institution: 'BINUS University',
      program: 'Bachelor of Science in Information Systems',
      period: 'Aug 2026 — Present',
    },
    {
      institution: 'Telkom Vocational High School Malang',
      program: 'High School Diploma in Software Engineering',
      period: 'Jul 2021 — Jun 2024',
      gpa: 'GPA: 87.52 / 100.00',
      honors: [
        'Finalist, Moklet Idea Challenge (2023)',
        'Top 10 Playbox Startup Competition (2021)',
      ],
    },
  ],
  stackIntro:
    'I work across the full application lifecycle, pairing typed web interfaces with backend APIs, relational data modeling, and retrieval-augmented LLM pipelines.',
  stackGroups: [
    {
      label: 'AI & LLM Engineering',
      items: [
        'Retrieval-Augmented Generation (RAG)',
        'LangChain',
        'LangGraph',
        'Flowise',
        'Ollama',
        'DeepSeek',
        'OpenAI',
        'Gemini',
        'Vector Search',
        'pgvector',
        'ETL Pipelines',
        'Prompt Engineering',
        'Langfuse',
        'Pydantic',
        'Cursor',
      ],
    },
    {
      label: 'Frontend & Web',
      items: [
        'TypeScript',
        'JavaScript',
        'React',
        'Next.js',
        'Svelte',
        'Angular',
        'Vite',
        'TanStack Start',
        'TanStack Router',
        'TanStack Query',
        'Tailwind CSS',
        'shadcn/ui',
        'React Hook Form',
        'HTML5',
        'CSS3',
      ],
    },
    {
      label: 'Backend & Runtime',
      items: [
        'Python',
        'FastAPI',
        'PHP',
        'Laravel',
        'Node.js',
        'Express.js',
        'Java',
        'Bun',
        'RESTful APIs',
        'WebSockets',
        'Server-Sent Events (SSE)',
        'MVC Architecture',
        'Zod',
      ],
    },
    {
      label: 'Data & Infrastructure',
      items: [
        'PostgreSQL',
        'MySQL',
        'SQL',
        'Docker',
        'AWS (EC2)',
        'Cloudflare Pages',
        'Cloudflare R2',
        'Cloudflare Turnstile',
        'Render',
        'Git / GitHub',
        'GitHub Actions',
        'Linux / Unix',
        'Playwright',
        'Katalon Studio',
        'Postman',
      ],
    },
  ],
  certifications: [
    {
      index: '01',
      title: 'IT Specialist in JavaScript',
      issuer: 'Certiport',
    },
    {
      index: '02',
      title: 'Junior Web Developer',
      issuer: 'BNSP',
    },
    {
      index: '03',
      title: 'Problem Solving (Basic)',
      issuer: 'HackerRank',
    },
    {
      index: '04',
      title: 'TOEIC',
      issuer: 'ETS',
      subtitle: 'Score: 615',
    },
  ],
  projects: [
    {
      index: '01',
      title: 'BrandMuse',
      domain: 'AI Brand Assistant',
      featured: true,
      role: 'AI Engineer, Personal Project',
      task: 'Creative teams needed an assistant to answer brand guideline questions with page citations and generate campaign concepts from a creative brief, while isolating uploads against prompt injection.',
      solution:
        'Built a FastAPI and React app with hybrid pgvector plus PostgreSQL full-text search via Reciprocal Rank Fusion (100% hit rate @5 on 18 test questions), LangChain structured retries, SSE streaming, Langfuse tracing, and 98/100 Lighthouse accessibility.',
      tech: [
        'Python',
        'FastAPI',
        'React',
        'Vite',
        'TypeScript',
        'Tailwind CSS',
        'shadcn/ui',
        'TanStack Query',
        'LangChain',
        'PostgreSQL (Neon)',
        'pgvector',
        'Cloudflare R2',
        'Gemini',
        'OpenAI',
        'Ollama',
        'Langfuse',
        'Docker',
      ],
      sourceUrl: 'https://github.com/rflishrl/brandmuse',
      diagram: {
        title: 'BrandMuse hybrid RAG and multi-provider generation architecture',
        width: 950,
        height: 300,
        nodes: [
          {
            id: 'ui',
            label: 'React + Vite Client',
            sublabel: 'Cloudflare Pages',
            x: 20,
            y: 112,
            w: 175,
            h: 76,
          },
          {
            id: 'api',
            label: 'FastAPI Service',
            sublabel: 'Render (Docker) · SSE',
            x: 310,
            y: 112,
            w: 185,
            h: 76,
          },
          {
            id: 'db',
            label: 'Neon PostgreSQL',
            sublabel: 'pgvector + FTS (RRF)',
            x: 650,
            y: 22,
            w: 280,
            h: 70,
          },
          {
            id: 'r2',
            label: 'Cloudflare R2',
            sublabel: 'Guideline Object Storage',
            x: 650,
            y: 115,
            w: 280,
            h: 70,
          },
          {
            id: 'llm',
            label: 'LangChain + Providers',
            sublabel: 'Gemini · OpenAI · Ollama · Langfuse',
            x: 650,
            y: 208,
            w: 280,
            h: 70,
          },
        ],
        edges: [
          { from: 'ui', to: 'api', label: 'REST / SSE' },
          { from: 'api', to: 'db', label: 'Hybrid Search' },
          { from: 'api', to: 'r2', label: 'PDF Store' },
          { from: 'api', to: 'llm', label: 'Structured Gen' },
        ],
      },
    },
    {
      index: '02',
      title: 'muatmuat Plus',
      domain: 'B2B Spare-Parts Marketplace',
      featured: true,
      role: 'AI Operator, Project Based',
      task: 'Heavy-vehicle buyers and verified manufacturers needed domestic and cross-border B2B marketplaces supporting factory-direct listings, subscription-gated transactions, checkout flows, and seller dashboards.',
      solution:
        'Owned UI, UX, and RESTful API integration for self-contained Next.js and Tailwind CSS pages across muatmuat Plus International and Plus Domestic, shipping product catalogs, order tracking, authentication, and subscription workflows with the frontend team.',
      tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'RESTful API', 'AI-Assisted Development'],
    },
    {
      index: '03',
      title: 'RT Online',
      domain: 'Community Administration API',
      featured: true,
      role: 'Web Programmer (Internship at Venturo Pro Indonesia)',
      task: 'A mobile application for community-level administration serving over 1,000 active users required a reliable RESTful backend, structured relational data model, and repeatable deployment workflow.',
      solution:
        'Led the backend team in Laravel and MySQL to deliver production RESTful APIs for mobile clients, optimizing schemas and indexing for fast queries while managing end-to-end DevOps and environment configuration.',
      tech: ['Laravel', 'PHP', 'MySQL', 'RESTful API'],
      diagram: {
        title: 'RT Online mobile client, Laravel RESTful API, and MySQL architecture',
        width: 950,
        height: 220,
        nodes: [
          {
            id: 'mobile',
            label: 'Flutter Mobile Client',
            sublabel: '1,000+ Active Users',
            x: 20,
            y: 72,
            w: 210,
            h: 76,
          },
          {
            id: 'laravel',
            label: 'Laravel API',
            sublabel: 'Clean MVC · RESTful Endpoints',
            x: 350,
            y: 72,
            w: 230,
            h: 76,
          },
          {
            id: 'mysql',
            label: 'MySQL Database',
            sublabel: 'Indexed Schemas',
            x: 710,
            y: 22,
            w: 220,
            h: 72,
          },
          {
            id: 'devops',
            label: 'DevOps Pipeline',
            sublabel: 'Deploy & Env Config',
            x: 710,
            y: 126,
            w: 220,
            h: 72,
          },
        ],
        edges: [
          { from: 'mobile', to: 'laravel', label: 'JSON API' },
          { from: 'laravel', to: 'mysql', label: 'Queries' },
          { from: 'laravel', to: 'devops', label: 'Release' },
        ],
      },
    },
    {
      index: '04',
      title: 'Desa Pendil',
      domain: 'Official Village Portal',
      role: 'Full Stack Developer',
      task: 'Desa Pendil in Probolinggo needed an accessible public website for residents across all age groups to read village news, explore public services and demographics, and browse community photo galleries.',
      solution:
        'Built a SvelteKit 3 and Svelte 5 portal with searchable news archives, Zod-validated API clients with an 8-second timeout and empty fallback states, on-demand revalidation, semantic landmarks, skip link, and self-hosted fonts.',
      tech: [
        'SvelteKit 3',
        'Svelte 5 (Runes)',
        'Vite',
        'Bun',
        'Node.js',
        'Tailwind CSS',
        'TypeScript',
        'Zod',
        'PostgreSQL (Neon)',
        'Cloudflare Turnstile',
        'Cloudflare R2',
      ],
      sourceUrl: 'https://github.com/rflishrl/desa-pendil',
    },
    {
      index: '05',
      title: 'Sinar Berkah',
      domain: 'Fabrication & Catalog Web',
      role: 'Full Stack Developer',
      task: 'A metal fabrication and laser cutting workshop in Malang needed a public website showcasing services, materials, past projects, ornamental patterns, and a live-searchable catalog routed to WhatsApp inquiries.',
      solution:
        'Built the SvelteKit 3 and Svelte 5 site with cached backend responses, on-demand revalidation, a 6-second timeout client with automatic retries, unit and API contract tests, reduced-motion and forced-colors support, and a prioritized hero image.',
      tech: [
        'SvelteKit 3',
        'Svelte 5 (Runes)',
        'Vite',
        'Bun',
        'Node.js',
        'Tailwind CSS',
        'TypeScript',
        'Zod',
        'PostgreSQL (Neon)',
        'Cloudflare Turnstile',
        'Cloudflare R2',
      ],
      sourceUrl: 'https://github.com/rflishrl/sinarberkah-plato',
    },
  ],
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

export function assertPortfolio(data: PortfolioData): void {
  const required = [
    data.displayName,
    data.legalName,
    data.headline,
    data.location,
    data.email,
    data.availability,
    data.currentFocus,
    data.portraitAlt,
    data.stackIntro,
  ];
  for (const field of required) {
    if (!field || !field.trim()) {
      throw new Error('Portfolio assertion failed: required field is empty.');
    }
  }

  if (data.bio.length !== 3) {
    throw new Error('Portfolio assertion failed: bio must contain exactly 3 paragraphs.');
  }
  data.bio.forEach((paragraph, idx) => {
    const words = countWords(paragraph);
    if (words === 0 || words > 55) {
      throw new Error(
        `Portfolio assertion failed: bio paragraph ${idx + 1} has ${words} words (limit 55).`,
      );
    }
  });

  if (
    data.experience.length === 0 ||
    data.education.length === 0 ||
    data.stackGroups.length === 0 ||
    data.certifications.length === 0 ||
    data.projects.length === 0
  ) {
    throw new Error('Portfolio assertion failed: required section array is empty.');
  }

  for (const project of data.projects) {
    const taskWords = countWords(project.task);
    const solutionWords = countWords(project.solution);
    if (taskWords === 0 || taskWords > 45) {
      throw new Error(`Project "${project.title}" task has ${taskWords} words (limit 45).`);
    }
    if (solutionWords === 0 || solutionWords > 45) {
      throw new Error(`Project "${project.title}" solution has ${solutionWords} words (limit 45).`);
    }
  }

  const forbiddenPattern = /\blorem\b|TODO|__SET_ME__|851-?1755-?5453/i;
  for (const str of collectStrings(data)) {
    if (forbiddenPattern.test(str)) {
      throw new Error(`Portfolio assertion failed: forbidden string detected in "${str}".`);
    }
  }
}
