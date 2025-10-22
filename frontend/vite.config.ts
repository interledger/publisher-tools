import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { APP_BASEPATH } from './app/lib/constants.js'
import path from 'path'

export default defineConfig({
  define: {
    BUILD_CDN_URL: JSON.stringify(process.env.BUILD_CDN_URL),
    BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL)
  },
  plugins: [cloudflare(), reactRouter(), tsconfigPaths()],
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
      '@/assets': path.resolve(__dirname, './app/assets/svg.tsx')
    }
  },
  build: {
    assetsDir: `${APP_BASEPATH.replace(/^\//, '')}/assets`,
    sourcemap: true,
    target: 'esnext',
    outDir: 'build'
  }
})
