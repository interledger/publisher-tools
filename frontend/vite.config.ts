import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import { APP_BASEPATH } from './app/lib/constants.js'

try {
  process.loadEnvFile('.dev.vars')
} catch {
  // do nothing.
}

export default defineConfig(({ mode, isSsrBuild }) => ({
  define: {
    BUILD_CDN_URL: JSON.stringify(process.env.BUILD_CDN_URL),
    BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL),
    BUILD_UMAMI_HOST: JSON.stringify(process.env.BUILD_UMAMI_HOST ?? process.env.UMAMI_HOST),
    BUILD_UMAMI_WEBSITE_ID: JSON.stringify(process.env.BUILD_UMAMI_WEBSITE_ID ?? process.env.UMAMI_WEBSITE_ID),
  },
  plugins: [
    cloudflare({
      persistState: {
        path: '../.wrangler',
      },
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@/components': path.resolve(
        __dirname,
        './app/components/redesign/components',
      ),
      '@/typography': path.resolve(
        __dirname,
        './app/components/redesign/Typography.tsx',
      ),
      '@/assets': path.resolve(__dirname, './app/assets/svg.tsx'),
      ...(mode === 'production' &&
        !isSsrBuild && { crypto: 'crypto-browserify' }),
    },
  },
  build: {
    assetsDir: `${APP_BASEPATH.replace(/^\//, '')}/assets`,
    sourcemap: true,
    target: 'esnext',
    outDir: 'build',
  },
}))
