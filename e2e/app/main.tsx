import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { fixtures } from './fixtures';
import './page.css';

const name = location.hash.replace(/^#\/?/, '');
const Fixture = fixtures[name];

// Every fixture gets a fresh document, so the Tailwind one never shares a page with the
// plain stylesheet.
window.addEventListener('hashchange', () => {
  location.reload();
});

async function start() {
  if (name === 'tailwind') await import('./tailwind.css');
  else await import('@b.taranenko/react-input-calendar/styles.css');

  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root');
  createRoot(root).render(
    <StrictMode>
      <h1>{name || 'Fixtures'}</h1>
      {Fixture ? (
        <Fixture />
      ) : (
        <ul>
          {Object.keys(fixtures).map((key) => (
            <li key={key}>
              <a href={`#/${key}`}>{key}</a>
            </li>
          ))}
        </ul>
      )}
    </StrictMode>,
  );
}

void start();
