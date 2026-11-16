export interface NavLink {
  readonly href: string;
  readonly label: string;
  readonly current?: boolean;
}

export type NavPage = 'home' | 'projects';

export function getNavLinks(homePrefix = '', currentPage: NavPage = 'home'): readonly NavLink[] {
  return [
    { href: `${homePrefix}#about`, label: 'About' },
    { href: `${homePrefix}#experience`, label: 'Experience' },
    { href: `${homePrefix}#education`, label: 'Education' },
    { href: `${homePrefix}#stack`, label: 'Stack' },
    { href: `${homePrefix}#certifications`, label: 'Certs' },
    {
      href: currentPage === 'projects' ? '/projects' : `${homePrefix}#projects`,
      label: 'Projects',
      current: currentPage === 'projects',
    },
    { href: '#contact', label: 'Contact' },
  ];
}
