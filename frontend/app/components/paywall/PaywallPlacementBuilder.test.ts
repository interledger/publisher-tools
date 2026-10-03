import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PaywallPlacementBuilder } from './PaywallPlacementBuilder'

vi.mock('~/stores/paywall-store', () => ({
  usePaywallProfile: () => [
    { behavior: { coverage: { value: 50 }, delay: { value: 0 } } },
    {},
  ],
}))

describe('PaywallPlacementBuilder', () => {
  it('shows the maximum delay and explains how to show the paywall immediately', () => {
    const html = renderToStaticMarkup(createElement(PaywallPlacementBuilder))

    expect(html).toContain(
      '<p>Maximum 15 seconds. Set to 0 to show the paywall immediately on page load.</p>',
    )
    expect(html).not.toContain('{{max}}')
  })

  it('associates the delay limit with the input for screen readers', () => {
    const html = renderToStaticMarkup(createElement(PaywallPlacementBuilder))
    const input = html.match(/<input\b[^>]*inputMode="decimal"[^>]*>/)?.[0]
    const descriptionId = input?.match(/aria-describedby="([^"]+)"/)?.[1]

    expect(descriptionId).toBeDefined()
    expect(html).toContain(
      `<p id="${descriptionId}" class="sr-only">Maximum 15 seconds. Set to 0 to show the paywall immediately on page load.</p>`,
    )
  })
})
