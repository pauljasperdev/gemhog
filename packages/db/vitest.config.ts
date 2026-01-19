// packages/db/vitest.config.ts
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@gemhog/db',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    hookTimeout: 60000, // 60s for Docker startup
    testTimeout: 10000, // 10s per test (DB operations can be slow)
  },
})
