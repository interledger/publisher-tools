/**
 * A wallet address that only exists in the tests. Lookups of it are answered
 * locally, in the browser and in the frontend's server, so no test needs the
 * internet.
 */
export const WALLET = {
  id: 'https://wallet.e2e.test/publisher',
  publicName: 'E2E Publisher',
  assetCode: 'USD',
  assetScale: 2,
  authServer: 'https://auth.wallet.e2e.test',
  resourceServer: 'https://wallet.e2e.test',
}
