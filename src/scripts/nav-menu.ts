const nav = document.querySelector<HTMLElement>('.site-nav');
const details = nav?.querySelector<HTMLDetailsElement>('.nav-menu') ?? null;
const summary = details?.querySelector<HTMLElement>('summary') ?? null;

if (nav && details && summary) {
  const compactMq = window.matchMedia('(min-width: 22.5em) and (max-width: 39.99em) and (min-height: 37.5em)');

  const close = () => {
    details.open = false;
  };

  details.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest('.nav-links a')) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && details.open) {
      close();
      summary.focus();
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (details.open && e.target instanceof Node && !nav.contains(e.target)) {
      close();
    }
  });

  nav.addEventListener('focusout', (e) => {
    if (!details.open) return;
    const next = e.relatedTarget;
    if (next instanceof Node && !nav.contains(next)) {
      close();
    }
  });

  compactMq.addEventListener('change', (e) => {
    if (!e.matches) {
      close();
    }
  });
}
