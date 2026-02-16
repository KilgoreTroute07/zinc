import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: false,
    environment: 'node',
    typecheck: {
      enabled: true,
      // Include normal test files so expectTypeOf/assertType are type-checked
      include: ['src/**/*.{test,spec}.ts'],
    },
    reporters: [['tree', { summary: false }]],
  },
});
