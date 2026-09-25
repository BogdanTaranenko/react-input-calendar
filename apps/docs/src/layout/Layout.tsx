import { useState, type ReactNode } from 'react';
import { href } from '../router';
import { Sidebar } from './Sidebar';
import { ThemeSwitch } from './ThemeSwitch';

const REPO_URL = 'https://github.com/BogdanTaranenko/react-input-calendar';

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      {/* A plain `#main` link would change the route; move focus instead. */}
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="header">
        <button
          type="button"
          className="menu-button"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
        >
          Menu
        </button>
        <a className="brand" href={href('')}>
          <span className="brand-mark" aria-hidden="true" />
          react-input-calendar
        </a>
        <div className="header-end">
          <ThemeSwitch />
          <a className="header-link" href={REPO_URL}>
            GitHub
          </a>
        </div>
      </header>
      <Sidebar
        id="site-nav"
        open={menuOpen}
        onNavigate={() => {
          setMenuOpen(false);
        }}
      />
      {children}
    </div>
  );
}
