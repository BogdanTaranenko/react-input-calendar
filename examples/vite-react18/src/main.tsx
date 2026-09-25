import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@b.taranenko/react-input-calendar/styles.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
