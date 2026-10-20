import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test as base } from '@playwright/test'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { deleteConfig } from './storage'
import { WALLET_ADDRESS } from './wallet'

type Fixtures = {
  /**
   * The test wallet address. Whatever a test saves for it is deleted afterwards,
   * so tests don't leave configs in the local storage.
   */
  wallet: Awaited<ReturnType<typeof getWalletAddress>>
  /** Serves a publisher's page with the embed script in it, and returns its URL */
  servePublisherPage: (embedScript: string) => Promise<string>
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring here
  wallet: async ({}, use) => {
    const wallet = await getWalletAddress(WALLET_ADDRESS)
    await use(wallet)
    await deleteConfig(normalizeWalletAddress(wallet))
  },
  // Served from a real local server rather than a mocked response, because
  // Chromium blocks a page from elsewhere from loading scripts off localhost
  // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring here
  servePublisherPage: async ({}, use) => {
    let html = ''
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo

    await use(async (embedScript) => {
      html = `<!doctype html>
<html lang="en">
  <head><title>Publisher page</title></head>
  <body>
    <h1>Publisher page</h1>
    ${embedScript}
  </body>
</html>`
      return `http://127.0.0.1:${port}/`
    })

    await new Promise((resolve) => {
      server.close(resolve)
      // The browser can hold connections open, which would keep close() waiting
      server.closeAllConnections()
    })
  },
})
