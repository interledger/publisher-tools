import { expect, type Page } from '@playwright/test'
import { test } from '../src/fixtures'
import { API_URL } from '../src/services'

// Wallet addresses the browser checks while you type. They are answered here,
// so the test needs no real wallet and never depends on the testnet.
const ALICE = 'https://wallet.e2e.test/alice'
const BOB = 'https://wallet.e2e.test/bob'
const MISSING = 'https://wallet.e2e.test/missing'

async function mockWallets(page: Page) {
  await page.route('https://wallet.e2e.test/**', (route) => {
    const url = route.request().url()
    if (url === MISSING) return route.fulfill({ status: 404 })
    return route.fulfill({
      json: {
        id: url,
        publicName: url.split('/').pop(),
        assetCode: 'USD',
        assetScale: 2,
        authServer: 'https://auth.wallet.e2e.test',
        resourceServer: 'https://wallet.e2e.test',
      },
    })
  })
}

/** Fills one row of the recipients table (rows start at 0). */
async function fillRecipient(
  page: Page,
  row: number,
  {
    name,
    pointer,
    percentage,
  }: { name?: string; pointer: string; percentage: string },
) {
  if (name) await page.locator(`#name-input-${row}`).fill(name)
  await page.locator(`#pointer-input-${row}`).fill(pointer)
  // The percentage stays disabled until the row has a wallet address
  await expect(page.locator(`#percentage-input-${row}`)).toBeEnabled()
  await page.locator(`#percentage-input-${row}`).fill(percentage)
}

const linkTag = (page: Page) =>
  page.locator('output').filter({ hasText: 'monetization' })

/** The [wallet address, weight, name] entries encoded in a revshare link. */
function decodeLink(href: string) {
  const prefix = new URL('revshare/', API_URL).href
  expect(href.startsWith(prefix)).toBe(true)
  const payload = href.slice(prefix.length)
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

test.beforeEach(async ({ page }) => {
  await mockWallets(page)
  await page.goto('prob-revshare')
  // The tool starts with two empty recipients
  await expect(page.locator('#pointer-input-1')).toBeVisible()
})

test('generates a link tag that holds every recipient and its share', async ({
  page,
}) => {
  await fillRecipient(page, 0, {
    name: 'Alice',
    pointer: ALICE,
    percentage: '60',
  })
  await fillRecipient(page, 1, { pointer: BOB, percentage: '40' })

  const tag = await test.step('the link tag is shown', async () => {
    await expect(linkTag(page)).toBeVisible()
    return (await linkTag(page).textContent())!
  })

  await test.step('the link encodes both recipients with their weights', async () => {
    const href = tag.match(/href="([^"]+)"/)?.[1]
    expect(tag).toMatch(/^<link rel="monetization" href="[^"]+" \/>$/)
    expect(decodeLink(href!)).toEqual([
      [ALICE, 60, 'Alice'],
      [BOB, 40, ''],
    ])
  })

  await test.step('importing the tag restores the recipients', async () => {
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.locator('#pointer-input-1')).toHaveValue('')

    await page.getByRole('button', { name: 'Import', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Paste monetization link tag' })
      .fill(tag)
    await page.getByRole('button', { name: 'Import revshare' }).click()

    await expect(page.locator('#name-input-0')).toHaveValue('Alice')
    await expect(page.locator('#pointer-input-0')).toHaveValue(ALICE)
    await expect(page.locator('#percentage-input-0')).toHaveValue('60')
    await expect(page.locator('#pointer-input-1')).toHaveValue(BOB)
    await expect(page.locator('#percentage-input-1')).toHaveValue('40')
    await expect(linkTag(page)).toHaveText(tag)
  })
})

test('a third recipient can be added and removed', async ({ page }) => {
  await fillRecipient(page, 0, { pointer: ALICE, percentage: '50' })
  await fillRecipient(page, 1, { pointer: BOB, percentage: '25' })
  await page.getByRole('button', { name: '+ Add recipient' }).click()
  await fillRecipient(page, 2, {
    pointer: 'https://wallet.e2e.test/carol',
    percentage: '25',
  })

  await expect(linkTag(page)).toBeVisible()
  const href = (await linkTag(page).textContent())!.match(/href="([^"]+)"/)![1]
  expect(decodeLink(href)).toHaveLength(3)

  await page.getByRole('button', { name: 'Remove recipient' }).last().click()
  await expect(page.locator('#pointer-input-2')).toHaveCount(0)
  // 50 + 25 is no longer 100%
  await expect(linkTag(page)).toHaveCount(0)
})

test.describe('shows an error and no link tag', () => {
  test('when the percentages add up to more than 100%', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '70' })
    await fillRecipient(page, 1, { pointer: BOB, percentage: '40' })

    await expect(
      page.getByText(
        'Percentages must add up to 100%. Current total: 110% (10% over).',
      ),
    ).toBeVisible()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when the percentages add up to less than 100%', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '50' })
    await fillRecipient(page, 1, { pointer: BOB, percentage: '40' })

    await expect(
      page.getByText(
        'Percentages must add up to 100%. Current total: 90% (10% short).',
      ),
    ).toBeVisible()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when a percentage is 0', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '100' })
    await fillRecipient(page, 1, { pointer: BOB, percentage: '0' })

    await expect(
      page.getByText('Each percentage must be greater than 0.'),
    ).toBeVisible()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when a percentage has more than 2 decimals', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '66.667' })
    await fillRecipient(page, 1, { pointer: BOB, percentage: '33.333' })

    await expect(
      page.getByText('Percentages can have at most 2 decimal places.'),
    ).toBeVisible()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when two recipients share a wallet address', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '50' })
    await fillRecipient(page, 1, { pointer: ALICE, percentage: '50' })

    await expect(
      page.getByText('Duplicate wallet address detected.', { exact: false }),
    ).toBeVisible()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when a wallet address does not exist', async ({ page }) => {
    await fillRecipient(page, 0, { pointer: ALICE, percentage: '50' })
    await page.locator('#pointer-input-1').fill(MISSING)

    await expect(page.getByText('Wallet address does not exist')).toBeVisible()
    // Its share can't be set until the address is fixed
    await expect(page.locator('#percentage-input-1')).toBeDisabled()
    await expect(linkTag(page)).toHaveCount(0)
  })

  test('when the imported tag is malformed', async ({ page }) => {
    await page.getByRole('button', { name: 'Import', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Paste monetization link tag' })
      .fill('<link rel="monetization" href="not a revshare link" />')
    await page.getByRole('button', { name: 'Import revshare' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.locator('#pointer-input-0')).toHaveValue('')
  })
})
