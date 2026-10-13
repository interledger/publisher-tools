import { WALLET } from './wallet'

/**
 * Runs inside the frontend's server during e2e tests (see ../vite.frontend.config.ts).
 * Answers lookups of the test wallet address, and passes everything else through.
 */
const realFetch = globalThis.fetch

globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  if (url === WALLET.id) {
    return Response.json(WALLET)
  }
  return realFetch(input, init)
}
