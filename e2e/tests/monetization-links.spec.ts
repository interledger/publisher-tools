import { expect, type Page } from '@playwright/test'
import { test } from '../src/fixtures'
import { CDN_URL } from '../src/services'

// The embed scripts add their link before fetching anything, so these don't
// need a saved profile or a real wallet address.
const WALLET_A = 'https://ilp.interledger-test.dev/publisher-a'
const WALLET_B = 'https://ilp.interledger-test.dev/publisher-b'
const REVSHARE = 'https://revshare.example/pay/publisher-a-and-b'

type Tool = 'banner' | 'widget' | 'offerwall'

const embed = (tool: Tool, walletAddress: string) =>
  `<script id="wmt-${tool}-init-script" type="module" src="${CDN_URL}/${tool}.js" data-wallet-address="${walletAddress}" data-tag="version1"></script>`

const link = (href: string, attributes = '') =>
  `<link rel="monetization" href="${href}"${attributes}>`

/** The page's monetization links, sorted (scripts add theirs to the head) */
async function getMonetizationLinks(page: Page) {
  // module scripts run before the load event
  await page.waitForLoadState('load')
  const links = await page
    .locator('link[rel="monetization"]')
    .evaluateAll((links) =>
      links.map(
        (link) =>
          `${link.getAttribute('href')}${link.hasAttribute('disabled') ? ' (disabled)' : ''}`,
      ),
    )
  return links.sort()
}

test.describe('monetization links added by the embed scripts', () => {
  test('the banner adds a link when the page has none', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(await servePublisherPage(embed('banner', WALLET_A)))

    expect(await getMonetizationLinks(page)).toEqual([WALLET_A])
  })

  test('the banner and widget keep the page’s own link', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        link(REVSHARE) + embed('banner', WALLET_A) + embed('widget', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([REVSHARE])
  })

  test('the banner and widget together add a single link', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        embed('banner', WALLET_A) + embed('widget', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([WALLET_A])
  })

  test('disabled links are not counted', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        link(WALLET_B, ' disabled') + embed('banner', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual(
      [WALLET_A, `${WALLET_B} (disabled)`].sort(),
    )
  })

  test('the offerwall reuses a link to its wallet address', async ({
    page,
    servePublisherPage,
  }) => {
    const sameWalletAddress = `${WALLET_A.replace('ilp.', 'ILP.')}/`
    await page.goto(
      await servePublisherPage(
        link(sameWalletAddress) + embed('offerwall', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([sameWalletAddress])
  })

  test('the offerwall adds its own link next to other wallet addresses', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(link(WALLET_B) + embed('offerwall', WALLET_A)),
    )

    expect(await getMonetizationLinks(page)).toEqual(
      [WALLET_A, WALLET_B].sort(),
    )
  })
})
