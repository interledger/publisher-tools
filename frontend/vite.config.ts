import path from 'path'
import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { APP_BASEPATH } from './app/lib/constants.js'

export default defineConfig(({ mode, isSsrBuild }) => ({
  define: {
    BUILD_CDN_URL: JSON.stringify(process.env.BUILD_CDN_URL),
    BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL)
  },
  plugins: [
    cloudflare({
      persistState: {
        path: '../.wrangler'
      }
    }),
    reactRouter(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      '@/components': path.resolve(
        __dirname,
        './app/components/redesign/components'
      ),
      '@/typography': path.resolve(
        __dirname,
        './app/components/redesign/Typography.tsx'
      ),
      '@/assets': path.resolve(__dirname, './app/assets/svg.tsx'),
      ...(mode === 'production' &&
        !isSsrBuild && { crypto: 'crypto-browserify' })
    }
  },
  build: {
    assetsDir: `${APP_BASEPATH.replace(/^\//, '')}/assets`,
    sourcemap: true,
    target: 'esnext',
    outDir: 'build'
  }
}))
