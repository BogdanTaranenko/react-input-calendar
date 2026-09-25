import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // The site is served from https://bogdantaranenko.github.io/react-input-calendar/.
  base: '/react-input-calendar/',
  plugins: [react()],
  // The library resolves React from its own devDependencies; one copy only.
  resolve: { dedupe: ['react', 'react-dom'] },
});
