import { expect, type Page } from '@playwright/test'
import { test } from '../src/fixtures'
import { CDN_URL } from '../src/services'

// The embed scripts add their link before fetching anything, so these don't
// need a saved profile or a real wallet address.
const WALLET_A = 'https://ilp.interledger-test.dev/publisher-a'
const WALLET_B = 'https://ilp.interledger-test.dev/publisher-b'
const WALLET_C = 'https://ilp.interledger-test.dev/publisher-c'
const REVSHARE = 'https://revshare.example/pay/publisher-a-and-b'

type Tool = 'banner' | 'widget' | 'offerwall'

const embed = (tool: Tool, walletAddress: string, walletAddressId?: string) =>
  `<script id="wmt-${tool}-init-script" type="module" src="${CDN_URL}/${tool}.js" data-wallet-address="${walletAddress}"${walletAddressId ? ` data-wallet-address-id="${walletAddressId}"` : ''} data-tag="version1"></script>`

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

  test('tools with the same wallet address share one link', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        embed('banner', WALLET_A) +
          embed('widget', WALLET_A) +
          embed('offerwall', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([WALLET_A])
  })

  test('tools with different wallet addresses each add their link', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        embed('banner', WALLET_A) +
          embed('widget', WALLET_B) +
          embed('offerwall', WALLET_C),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual(
      [WALLET_A, WALLET_B, WALLET_C].sort(),
    )
  })

  test('a link on the page to the same wallet address is reused', async ({
    page,
    servePublisherPage,
  }) => {
    // the host's case doesn't change the wallet address
    const sameWalletAddress = WALLET_A.replace('ilp.', 'ILP.')
    await page.goto(
      await servePublisherPage(
        link(sameWalletAddress) +
          embed('banner', WALLET_A) +
          embed('widget', WALLET_A) +
          embed('offerwall', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([sameWalletAddress])
  })

  test('a link with a trailing slash to the same wallet address is reused', async ({
    page,
    servePublisherPage,
  }) => {
    const sameWalletAddress = `${WALLET_A}/`
    await page.goto(
      await servePublisherPage(
        link(sameWalletAddress) + embed('banner', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([sameWalletAddress])
  })

  test('a link to the wallet address as /.well-known/pay is reused', async ({
    page,
    servePublisherPage,
  }) => {
    // a payment pointer such as $wallet.example maps to /.well-known/pay
    const walletAddress = 'https://wallet.example'
    const wellKnown = `${walletAddress}/.well-known/pay`
    await page.goto(
      await servePublisherPage(
        link(wellKnown) + embed('banner', walletAddress),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([wellKnown])
  })

  test('links to other wallet addresses, such as a revenue share, are kept', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        link(REVSHARE) + embed('banner', WALLET_A) + embed('widget', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual(
      [REVSHARE, WALLET_A].sort(),
    )
  })

  test('a link to the normalized wallet address id is reused', async ({
    page,
    servePublisherPage,
  }) => {
    // e.g. an Interledger Cards wallet address entered as its ilp.dev address
    const walletAddress = 'https://ilp.dev/publisher-a'
    const walletAddressId = 'https://ilp.interledger.cards/publisher-a'
    await page.goto(
      await servePublisherPage(
        link(walletAddressId) + embed('banner', walletAddress, walletAddressId),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual([walletAddressId])
  })

  test('a disabled link is not reused', async ({
    page,
    servePublisherPage,
  }) => {
    await page.goto(
      await servePublisherPage(
        link(WALLET_A, ' disabled') + embed('banner', WALLET_A),
      ),
    )

    expect(await getMonetizationLinks(page)).toEqual(
      [WALLET_A, `${WALLET_A} (disabled)`].sort(),
    )
  })
})
