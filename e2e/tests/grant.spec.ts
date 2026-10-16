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
  // Goes through the wallet provider's login and ownership confirmation
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

    // The wallet asks to log in first. Its login form only works once React
    // hydrates it, before that a click submits it natively and drops the
    // callback to the grant
    const loginButton = page.getByRole('button', { name: 'login' })
    await expect
      .poll(() => loginButton.evaluate(isHydrated), { timeout: 30_000 })
      .toBe(true)
    await page.getByRole('textbox', { name: 'E-mail' }).fill(login.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(login.password)
    await loginButton.click()

    // An ownership grant needs no consent, the wallet confirms it and sends
    // the publisher back by itself
    await expect(
      page.getByText(`Confirmed ${wallet.id} ownership`),
    ).toBeVisible({ timeout: 30_000 })

    // Back on the frontend, the save that asked for the grant goes through
    await expect(
      page.getByRole('dialog').getByText('Your edits have been saved'),
    ).toBeVisible({ timeout: 30_000 })
  })
})

// React attaches its props to the DOM nodes it has hydrated
function isHydrated(element: Element) {
  return Object.keys(element).some((key) => key.startsWith('__reactProps$'))
}
