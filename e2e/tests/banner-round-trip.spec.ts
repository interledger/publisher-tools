import { expect } from '@playwright/test'
import { test } from '../src/publisher-page'
import { API_URL } from '../src/services'
import { authorizeWallet } from '../src/session'
import { WALLET } from '../src/wallet'

test('a banner saved in the frontend renders on a publisher page', async ({
  page,
  request,
  servePublisherPage,
}, testInfo) => {
  await authorizeWallet(page.context(), WALLET.id)
  // The browser's lookup of the wallet address; the frontend's server has its own mock
  await page.route(WALLET.id, (route) =>
    route.fulfill({
      json: WALLET,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  )

  // Unique per run, so a title left over from an earlier run can't pass
  const title = `E2E ${testInfo.project.name} ${Date.now()}`

  await test.step('connect the wallet address', async () => {
    await page.goto('banner')
    const walletInput = page.getByRole('textbox', { name: 'Wallet address' })
    // Typing before the page is interactive is lost, so retry until it sticks
    await expect(async () => {
      await walletInput.fill(WALLET.id)
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(walletInput).not.toBeEditable({ timeout: 1000 })
    }).toPass()
    await expect(walletInput).toBeDisabled({ timeout: 15_000 })
  })

  const snippet = await test.step('change the title and save', async () => {
    await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title)
    await page.getByRole('button', { name: 'Save and generate script' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Your script is ready')).toBeVisible()
    const scriptTag = await dialog
      .getByRole('region', { name: 'Script tag snippet' })
      .textContent()
    expect(scriptTag).toContain('banner.js')
    return scriptTag!
  })

  await test.step('the api returns the saved profile', async () => {
    // Ask for the same profile the embed script will ask for
    const attribute = (name: string) =>
      snippet.match(new RegExp(` ${name}="([^"]*)"`))?.[1]
    const walletAddress =
      attribute('data-wallet-address-id') ?? attribute('data-wallet-address')
    const url = new URL('profile/banner', API_URL)
    url.searchParams.set('wa', walletAddress!)
    url.searchParams.set('id', attribute('data-tag')!)
    const response = await request.get(url.href)

    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ title: { text: title } })
  })

  await test.step('the embed script renders the saved banner', async () => {
    await page.goto(await servePublisherPage(snippet))

    const banner = page.locator('wm-banner')
    await expect(banner).toBeVisible()
    await expect(banner.getByText(title)).toBeVisible()
  })
})
