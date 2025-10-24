import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { APP_BASEPATH } from './app/lib/constants.js'
import path from 'path'

export default defineConfig(({ mode, isSsrBuild }) => {
  const isProduction = mode === 'production'
  const alias: Record<string, string> = {
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

  if (isProduction && !isSsrBuild) {
    alias['crypto'] = 'crypto-browserify'
  }

  return {
    define: {
      BUILD_CDN_URL: JSON.stringify(process.env.BUILD_CDN_URL),
      BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL)
    },
    plugins: [cloudflare(), reactRouter(), tsconfigPaths()],
    resolve: {
      alias
    },
    build: {
      assetsDir: `${APP_BASEPATH.replace(/^\//, '')}/assets`,
      sourcemap: true,
      target: 'esnext',
      outDir: 'build'
    }
  }
})
