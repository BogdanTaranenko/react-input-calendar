import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  plugins: [react(), tailwindcss()],
  // The library resolves React from its own devDependencies; one copy only.
  resolve: { dedupe: ['react', 'react-dom'] },
});
