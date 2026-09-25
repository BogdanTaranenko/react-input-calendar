import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@b.taranenko/react-input-calendar/styles.css';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
