import path from 'node:path'
import { defineConfig, mergeConfig, type Plugin } from 'vite'
import frontendConfig from '../frontend/vite.config.ts'

const FRONTEND_ROOT = path.resolve(import.meta.dirname, '../frontend')
const FRONTEND_WORKER = path.join(FRONTEND_ROOT, 'worker.ts')
const MOCK_WALLET_FETCH = path.resolve(
  import.meta.dirname,
  './src/mock-wallet-fetch.ts',
)

/**
 * The frontend's server looks wallet addresses up itself, where Playwright
 * can't intercept the request. This loads the mock into that server instead.
 */
function mockWalletFetch(): Plugin {
  return {
    name: 'e2e-mock-wallet-fetch',
    transform(code, id) {
      if (path.normalize(id) !== FRONTEND_WORKER) return
      return {
        code: `import ${JSON.stringify(MOCK_WALLET_FETCH)}\n${code}`,
        map: null,
      }
    },
  }
}

/** The frontend's own Vite config, plus the wallet mock. Used only by the e2e tests. */
export default defineConfig(async (env) =>
  mergeConfig(await frontendConfig(env), {
    // Keep apart from the cache of a dev server running at the same time
    cacheDir: 'node_modules/.vite-e2e',
    plugins: [mockWalletFetch()],
  }),
)
