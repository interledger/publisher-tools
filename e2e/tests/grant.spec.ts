import { expect } from '@playwright/test'
import { test } from '../src/fixtures'
import { connectWallet, WALLET_LOGIN } from '../src/wallet'

// Where the wallet provider sends the publisher back after the grant step
const GRANT_CALLBACK = 'api/grant/banner/'

test('a declined grant shows an error', async ({ page }) => {
  await page.goto(`${GRANT_CALLBACK}?result=grant_rejected`)

  await expect(page).toHaveURL(/\/banner\/?$/)
  await expect(
    page.getByRole('dialog').getByText('Wallet authorization was declined.'),
  ).toBeVisible()
})

test('a grant without a pending session shows it expired', async ({ page }) => {
  await page.goto(`${GRANT_CALLBACK}?interact_ref=e2e`)

  await expect(page).toHaveURL(/\/banner\/?$/)
  await expect(
    page
      .getByRole('dialog')
      .getByText('Your session has expired. Please try again.'),
  ).toBeVisible()
})

test.describe('with a test wallet login', () => {
  test.skip(
    !WALLET_LOGIN,
    'Set E2E_WALLET_EMAIL and E2E_WALLET_PASSWORD, see docs/env-vars.md',
  )
  // Goes through the wallet provider's login and consent pages
  test.slow()

  test('approving the grant at the wallet lets the publisher save', async ({
    page,
    wallet,
  }) => {
    const login = WALLET_LOGIN!
    await page.goto('banner')
    await connectWallet(page)
    await page
      .getByRole('textbox', { name: 'Title', exact: true })
      .fill(`E2E grant ${Date.now()}`)
    await page.getByRole('button', { name: 'Save edits only' }).click()

    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog.getByText(wallet.id)).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Confirm' }).click()

    // The wallet asks to log in first, unless it remembers the session
    const emailInput = page.getByRole('textbox', { name: 'E-mail' })
    const acceptButton = page.getByRole('button', { name: 'accept' })
    await expect(emailInput.or(acceptButton)).toBeVisible({ timeout: 30_000 })
    if (await emailInput.isVisible()) {
      await emailInput.fill(login.email)
      await page.getByRole('textbox', { name: 'Password' }).fill(login.password)
      await page.getByRole('button', { name: 'login' }).click()
    }
    await acceptButton.click({ timeout: 30_000 })

    // Back on the frontend, the save that asked for the grant goes through
    await expect(
      page.getByRole('dialog').getByText('Your edits have been saved'),
    ).toBeVisible({ timeout: 30_000 })
  })
})
