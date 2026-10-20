import { expect, type Page } from '@playwright/test'

/**
 * The frontend looks this wallet address up on the Interledger test network,
 * so it has to be a real one. Tests only write to the local storage.
 */
export const WALLET_ADDRESS =
  process.env.E2E_WALLET_ADDRESS || 'https://ilp.interledger-test.dev/alice'

/**
 * Login for the test wallet account that owns WALLET_ADDRESS, used to approve
 * grants. Tests that need it are skipped when it isn't set.
 */
export const WALLET_LOGIN =
  process.env.E2E_WALLET_EMAIL && process.env.E2E_WALLET_PASSWORD
    ? {
        email: process.env.E2E_WALLET_EMAIL,
        password: process.env.E2E_WALLET_PASSWORD,
      }
    : undefined

/** Connects WALLET_ADDRESS on a tool page that's already open */
export async function connectWallet(page: Page) {
  const walletInput = page.getByRole('textbox', { name: 'Wallet address' })
  // Typing before the page is interactive is lost, so retry until it sticks
  await expect(async () => {
    await walletInput.fill(WALLET_ADDRESS)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(walletInput).not.toBeEditable({ timeout: 1000 })
  }).toPass()
  await expect(walletInput).toBeDisabled({ timeout: 15_000 })
}
