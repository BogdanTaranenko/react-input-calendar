import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.test.*', 'src/index.ts', 'src/styles/**'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        'src/date/**': { lines: 100, branches: 100 },
        'src/core/**': { lines: 100, branches: 100 },
        'src/overlay/compute-position.ts': { lines: 100, branches: 100 },
        'src/time/time-utils.ts': { lines: 100, branches: 100 },
      },
    },
  },
});
