import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

describe('Static verification of dist/', () => {
  test('dist/index.html exists and no reference or source PDFs leaked', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
    const allFiles = walkFiles(distDir).map((f) => path.relative(distDir, f).replaceAll('\\', '/'));

    const forbiddenFiles = [
      '01-hero.png',
      '02-about.png',
      '03-stack.png',
      '04-case-study-title.png',
      '05-case-study-mockup.png',
      '06-case-study-longread.png',
      '07-contact.png',
      'resume.pdf',
      'portfolio.pdf',
    ];
    for (const name of forbiddenFiles) {
      expect(allFiles.some((f) => f.endsWith(name))).toBe(false);
    }
  });

  test('HTML structure, headings, images, anchors, CSP & privacy checks', async () => {
    const html = fs.readFileSync(indexPath, 'utf8');

    // Privacy and placeholder scan across all text assets in dist/
    const allFiles = walkFiles(distDir).filter((f) => /\.(html|js|css|svg|txt|xml)$/i.test(f));
    const forbiddenContent = /\blorem\b|TODO|__SET_ME__|851-?1755-?5453|C:\\/i;
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(forbiddenContent.test(content)).toBe(false);
    }

    let htmlLang = '';
    let h1Count = 0;
    const headings: number[] = [];
    const ids = new Set<string>();
    const internalAnchors: string[] = [];
    const imgsMissingAlt: string[] = [];
    const thirdPartyResourceUrls: string[] = [];
    const inlineExecutableScripts: string[] = [];

    const rewriter = new HTMLRewriter()
      .on('html', {
        element(el) {
          htmlLang = el.getAttribute('lang') ?? '';
        },
      })
      .on('[id]', {
        element(el) {
          const id = el.getAttribute('id');
          if (id) ids.add(id);
        },
      })
      .on('h1, h2, h3, h4, h5, h6', {
        element(el) {
          const level = Number(el.tagName.slice(1));
          headings.push(level);
          if (level === 1) h1Count += 1;
        },
      })
      .on('img', {
        element(el) {
          const alt = el.getAttribute('alt');
          if (alt === null || alt.trim().length === 0) {
            imgsMissingAlt.push(el.getAttribute('src') ?? 'unknown');
          }
          const src = el.getAttribute('src');
          if (src && /^https?:\/\//i.test(src)) {
            thirdPartyResourceUrls.push(src);
          }
        },
      })
      .on('a[href]', {
        element(el) {
          const href = el.getAttribute('href') ?? '';
          if (href.startsWith('#') && href.length > 1) {
            internalAnchors.push(href.slice(1));
          }
        },
      })
      .on('link[href]', {
        element(el) {
          const rel = el.getAttribute('rel') ?? '';
          const href = el.getAttribute('href') ?? '';
          if (rel !== 'canonical' && /^https?:\/\//i.test(href)) {
            thirdPartyResourceUrls.push(href);
          }
        },
      })
      .on('script', {
        element(el) {
          const src = el.getAttribute('src');
          const type = el.getAttribute('type') ?? '';
          if (src && /^https?:\/\//i.test(src)) {
            thirdPartyResourceUrls.push(src);
          }
          if (!src && type !== 'application/ld+json') {
            inlineExecutableScripts.push(type || 'classic');
          }
        },
      });

    await rewriter.transform(new Response(html)).text();

    expect(htmlLang).toBe('en');
    expect(h1Count).toBe(1);
    expect(headings.length).toBeGreaterThan(1);

    for (let i = 1; i < headings.length; i += 1) {
      const prev = headings[i - 1]!;
      const curr = headings[i]!;
      expect(curr - prev).toBeLessThanOrEqual(1);
    }

    expect(imgsMissingAlt).toEqual([]);
    for (const target of internalAnchors) {
      expect(ids.has(target)).toBe(true);
    }
    expect(thirdPartyResourceUrls).toEqual([]);
    expect(inlineExecutableScripts).toEqual([]);

    // Client JS budget <= 3 KB gzip combined (§2)
    const jsFiles = walkFiles(distDir).filter((f) => f.endsWith('.js'));
    let totalGzipBytes = 0;
    for (const jsFile of jsFiles) {
      const gzipped = Bun.gzipSync(fs.readFileSync(jsFile));
      totalGzipBytes += gzipped.byteLength;
    }
    expect(totalGzipBytes).toBeLessThanOrEqual(3072);

    // Inline CSS active (no render-blocking stylesheet link) & Open Graph image present
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/i);
    expect(html).toContain('property="og:image" content="https://www.raflisahrul.my.id/og-image.png"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });
});
