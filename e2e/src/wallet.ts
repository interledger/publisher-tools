/**
 * The frontend looks this wallet address up on the Interledger test network,
 * so it has to be a real one. Tests only write to the local storage.
 */
export const WALLET_ADDRESS =
  process.env.E2E_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/alice'
