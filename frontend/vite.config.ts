import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig, type Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { APP_BASEPATH } from './app/lib/constants.js'
import path from 'path'

/**
 * Custom plugin to handle root redirects to basepath in dev
 */
const devRedirectPlugin = (): Plugin => ({
  name: 'dev-redirect',
  configureServer(server) {
    server.middlewares.use('/', (req, res, next) => {
      if (req.url === '/') {
        res.writeHead(302, { Location: APP_BASEPATH + '/' })
        res.end()
        return
      }
      next()
    })
  }
})

export default defineConfig({
  define: {
    BUILD_CDN_URL: JSON.stringify(process.env.BUILD_CDN_URL),
    BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL) // unused but declared
  },
  plugins: [cloudflare(), reactRouter(), tsconfigPaths(), devRedirectPlugin()],
  resolve: {
    alias: {
      'crypto': 'crypto-browserify',
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
