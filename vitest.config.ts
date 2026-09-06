import { defineConfig } from 'vitest/config';

// Vitest unit-test config (knowledge.md §4) — unit tests target non-UI logic:
// Pages Functions in functions/ and util modules in src/lib/. Playwright E2E
// specs live in e2e/ and run under Playwright (Task #005/#019), so the include
// scope below keeps the two test runners isolated.
export default defineConfig({
  test: {
    include: ['functions/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    // Keep `npm run test` green until Task #010/#011 add the first real tests.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Measure only non-UI logic — the same scope as the 70% coverage target.
      include: ['functions/**/*.ts', 'src/lib/**/*.ts'],
    },
  },
});
