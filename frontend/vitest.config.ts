import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
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
