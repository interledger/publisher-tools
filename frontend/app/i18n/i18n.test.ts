import { RouterContextProvider } from 'react-router'
import i18next from 'i18next'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  i18nConfig,
  defaultLanguage,
  supportedLanguages,
  defaultNS,
  fallbackNS,
} from './config.js'
import { i18nextMiddleware, getLocale, getInstance } from './i18n.server.js'
import { loader as rootLoader } from '../root.js'

function createArgs(request: Request, context: RouterContextProvider) {
  const url = new URL(request.url)
  return {
    request,
    context,
    params: {},
    url,
    pattern: url.pathname,
  }
}

describe('i18n configuration and remix-i18next setup', () => {
  beforeEach(async () => {
    if (i18next.isInitialized) {
      await i18next.changeLanguage('en')
    }
  })

  it('exports valid default language and namespaces configuration', () => {
    expect(defaultLanguage).toBe('en')
    expect(supportedLanguages).toContain('en')
    expect(defaultNS).toBe('paywall')
    expect(fallbackNS).toBe('general')
    expect(i18nConfig.keySeparator).toBe(false)
  })

  it('contains all required namespaces in resources', () => {
    const enNamespaces = Object.keys(i18nConfig.resources.en)
    expect(enNamespaces).toEqual(
      expect.arrayContaining([
        'general',
        'header',
        'toolsWalletAddress',
        'grantInteraction',
        'paymentResult',
        'paywall',
      ]),
    )
  })

  describe('server-side middleware and detection', () => {
    it('detects English when Accept-Language header contains en', async () => {
      const context = new RouterContextProvider()
      const request = new Request('https://publisher-tools.test/', {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      })

      let calledNext = false
      const args = createArgs(request, context)
      await i18nextMiddleware(args, async () => {
        calledNext = true
        expect(getLocale(context)).toBe('en')
        const instance = getInstance(context)
        expect(instance).toBeDefined()
        expect(instance.t('input.price.label')).toBe('Amount')
        return new Response('ok')
      })

      expect(calledNext).toBe(true)
    })

    it('falls back to default language when Accept-Language is unsupported', async () => {
      const context = new RouterContextProvider()
      const request = new Request('https://publisher-tools.test/', {
        headers: { 'Accept-Language': 'ja,zh;q=0.9' },
      })

      const args = createArgs(request, context)
      await i18nextMiddleware(args, async () => {
        expect(getLocale(context)).toBe('en')
        return new Response('ok')
      })
    })

    it('propagates detected locale through root loader', async () => {
      const context = new RouterContextProvider()
      const request = new Request('https://publisher-tools.test/', {
        headers: { 'Accept-Language': 'en' },
      })

      const args = createArgs(request, context)
      await i18nextMiddleware(args, async () => {
        const loaderResult = await rootLoader(args)
        expect(loaderResult).toEqual({ locale: 'en' })
        return new Response('ok')
      })
    })
  })

  describe('client-side translations and interpolation', () => {
    it('translates default, explicit, and fallback namespaces', () => {
      expect(i18next.isInitialized).toBe(true)
      expect(i18next.t('input.price.label')).toBe('Amount')
      expect(i18next.t('tools')).toBe('Tools') // fallback to general

      const headerT = i18next.getFixedT('en', 'header')
      expect(headerT('nav.docs')).toBe('Documentation')
    })

    it('interpolates parameters using {{param}} syntax', () => {
      expect(i18next.t('input.price.hint', { currency: 'USD' })).toBe(
        "Charged in your wallet's currency (USD)",
      )
    })
  })
})
