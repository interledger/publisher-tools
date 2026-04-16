import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.ts'],
      exclude: ['app/**/*.test.ts', 'app/**/*.d.ts'],
    },
  },
})
