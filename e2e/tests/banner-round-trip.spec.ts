import { expect, type Page, type TestInfo } from '@playwright/test'
import type { getWalletAddress } from '@shared/utils'
import { test } from '../src/fixtures'
import { API_URL } from '../src/services'
import { authorizeWallet } from '../src/session'
import { connectWallet } from '../src/wallet'

async function setupBanner(
  page: Page,
  testInfo: TestInfo,
  wallet: Awaited<ReturnType<typeof getWalletAddress>>,
) {
  await authorizeWallet(page.context(), wallet.id)

  // Unique per run, so a title left over from an earlier run can't pass
  const title = `E2E ${testInfo.project.name} ${Date.now()}`

  await test.step('connect the wallet address', async () => {
    await page.goto('banner')
    await connectWallet(page)
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

  return { title, snippet }
}

test('a banner saved in the frontend renders on a publisher page', async ({
  page,
  request,
  servePublisherPage,
  wallet,
}, testInfo) => {
  const { title, snippet } = await setupBanner(page, testInfo, wallet)

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

test('closing the banner is remembered for the session', async ({
  page,
  servePublisherPage,
  wallet,
}, testInfo) => {
  const { snippet } = await setupBanner(page, testInfo, wallet)

  const publisherPageUrl = await servePublisherPage(snippet)

  await test.step('the banner is visible before closing', async () => {
    await page.goto(publisherPageUrl)
    await expect(page.locator('wm-banner')).toBeVisible()
  })

  await test.step('closing the banner sets the sessionStorage key', async () => {
    await page
      .locator('wm-banner')
      .getByRole('button', { name: 'Close banner' })
      .click()

    const storedValue = await page.evaluate(() =>
      sessionStorage.getItem('_wm_tools_closed_by_user'),
    )
    expect(storedValue).toBe('true')
  })

  await test.step('the banner does not reappear after a reload in the same session', async () => {
    await page.reload()
    await expect(page.locator('wm-banner')).not.toBeAttached()
  })
})
