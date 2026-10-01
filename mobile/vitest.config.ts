import { defineConfig } from 'vitest/config';
import path from 'node:path';

const engineSrc = path.resolve(__dirname, '../shared/form-engine/src');

export default defineConfig({
  test: {
    environment: 'node',
    // The engine's own suites import assertions from deno.land, which the Node
    // ESM loader cannot fetch. They are the backend's responsibility to run
    // (`deno task test` in shared/form-engine); mobile asserts engine
    // *behaviour* through its own suites below.
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      // The shared form engine is the same source the backend and frontend use.
      // Aliasing it here keeps mobile tests exercising identical logic offline.
      '@forms': path.join(engineSrc, 'index.ts'),
    },
  },
});