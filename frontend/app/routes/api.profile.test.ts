import type { ActionFunctionArgs } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BannerProfile, WidgetProfile } from '@shared/types'
import { SANITIZATION_ERROR_CAUSE } from '~/utils/sanitize.server'
import { action } from './api.profile'

vi.mock('@shared/utils', () => ({
  getWalletAddress: vi.fn().mockResolvedValue({
    id: 'https://example.com/wallet',
    publicName: 'Test Wallet',
    authServer: 'https://auth.example.com',
    assetCode: 'USD',
    assetScale: 2,
  }),
  normalizeWalletAddress: vi.fn().mockReturnValue('example.com/wallet'),
  toWalletAddressUrl: vi.fn((url: string) => url),
  checkHrefFormat: vi.fn(),
}))

vi.mock('~/utils/session.server.js', () => ({
  getSession: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === 'validForWallet') return 'https://example.com/wallet'
      return null
    }),
    set: vi.fn(),
  }),
  commitSession: vi.fn().mockResolvedValue('session-cookie'),
}))

vi.mock('~/utils/config-storage.server.js', () => ({
  ConfigStorageService: vi.fn().mockImplementation(() => ({
    getJson: vi.fn().mockResolvedValue(null),
    putJson: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('~/utils/open-payments.server.js', () => ({
  createInteractiveGrant: vi.fn().mockResolvedValue({
    interact: { redirect: 'https://auth.example.com/grant' },
  }),
}))

describe('api.profile action - HTML injection', () => {
  let mockRequest: Request
  let mockContext: ActionFunctionArgs['context']

  const bannerProfilePayload: BannerProfile = {
    $version: '1.0.0',
    $name: 'test-profile',
    bannerTitleText: 'Fund me',
    bannerDescriptionText: 'Support our work',
    bannerDescriptionVisible: true,
    bannerPosition: 'Top',
    bannerSlideAnimation: 'Slide',
    bannerBorder: 'Light',
    bannerFontName: 'Arial',
    bannerFontSize: 16,
    bannerTextColor: '#000000',
    bannerBackgroundColor: '#ffffff',
    bannerThumbnail: 'thumbnail',
  }
  const widgetProfilePayload: WidgetProfile = {
    $version: '1.0.0',
    $name: 'clean-profile',
    widgetTitleText: 'Support Our Work',
    widgetDescriptionText: 'We appreciate your contributions to our project',
    widgetDescriptionVisible: true,
    widgetButtonText: 'Donate Now',
    widgetPosition: 'Right',
    widgetDonateAmount: 5,
    widgetButtonBorder: 'Pill',
    widgetFontName: 'Arial',
    widgetFontSize: 16,
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetButtonTextColor: '#ffffff',
    widgetButtonBackgroundColor: '#000000',
    widgetTriggerBackgroundColor: '#000000',
    widgetTriggerIcon: 'heart',
  }

  beforeEach(() => {
    mockContext = {
      cloudflare: {
        env: {
          AWS_S3_BUCKET: 'test-bucket',
          AWS_S3_ENDPOINT: 'https://s3.example.com',
          AWS_S3_KEY_ID: 'test-key-id',
          AWS_S3_SECRET_KEY: 'test-secret-key',
        },
      },
    } as ActionFunctionArgs['context']
  })

  it('should reject XSS script injection in widget title text', async () => {
    const maliciousPayload = {
      walletAddress: 'https://example.com/wallet',
      profileId: 'version1',
      tool: 'widget',
      profile: {
        $version: '1.0.0',
        $name: 'version1',
        widgetTitleText: '<script>alert("XSS")</script>',
        widgetDescriptionText: 'Please support our work',
        widgetDescriptionVisible: true,
        widgetButtonText: 'Donate',
        widgetPosition: 'Left',
        widgetDonateAmount: 5,
        widgetButtonBorder: 'Pill',
        widgetFontName: 'Arial',
        widgetFontSize: 16,
        widgetTextColor: '#000000',
        widgetBackgroundColor: '#ffffff',
        widgetButtonTextColor: '#ffffff',
        widgetButtonBackgroundColor: '#000000',
        widgetTriggerBackgroundColor: '#000000',
        widgetTriggerIcon: 'heart',
      },
    }

    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('widgetTitleText')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'widgetTitleText',
    })
  })

  it('should reject HTML injection in widget description field', async () => {
    const maliciousPayload = {
      walletAddress: 'https://example.com/wallet',
      profileId: 'version1',
      tool: 'widget',
      profile: {
        $version: '1.0.0',
        $name: 'test-profile',
        widgetTitleText: 'Support Us',
        widgetDescriptionText:
          '<img src=x onerror="alert(\'XSS\')">Please support our work',
        widgetDescriptionVisible: true,
        widgetButtonText: 'Donate',
        widgetPosition: 'Right',
        widgetDonateAmount: 5,
        widgetButtonBorder: 'Pill',
        widgetFontName: 'Arial',
        widgetFontSize: 16,
        widgetTextColor: '#000000',
        widgetBackgroundColor: '#ffffff',
        widgetButtonTextColor: '#ffffff',
        widgetButtonBackgroundColor: '#000000',
        widgetTriggerBackgroundColor: '#000000',
        widgetTriggerIcon: 'heart',
      },
    }

    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('widgetDescriptionText')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'widgetDescriptionText',
    })
  })

  it('should reject event handler attributes in banner title', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          bannerTitleText: '<div onclick="stealData()">Click Here</div>',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('bannerTitleText')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'bannerTitleText',
    })
  })

  it('should reject encoded HTML entities in banner description', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          bannerDescriptionText:
            '&lt;iframe src=&quot;https://evil.com&quot;&gt;&lt;/iframe&gt;',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain(
      'Invalid HTML in field: bannerDescriptionText',
    )
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'bannerDescriptionText',
    })
  })

  it('should reject HTML in widget title text field', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          widgetTitleText: '<b>Click Here</b>',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('widgetTitleText')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'widgetTitleText',
    })
  })

  it('should reject HTML in widget version name field', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          $name: '<script>alert("XSS")</script>',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('versionName')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'versionName',
    })
  })

  it('should reject HTML in banner version name field', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          $name: '<img src=x onerror="stealCookies()">',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toContain('versionName')
    expect(response.data.error?.cause?.errors).toEqual({
      reason: SANITIZATION_ERROR_CAUSE,
      field: 'versionName',
    })
  })

  it('should reject malicious widgetBackgroundColor via Zod validation', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          widgetBackgroundColor: '<script>alert("XSS")</script>',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toBe('Validation failed')
    expect(response.data.error?.cause?.message).toBe(
      'One or more fields failed validation',
    )
  })

  it('should reject malicious bannerTextColor via Zod validation', async () => {
    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          bannerTextColor: '<img src=x onerror="stealCookies()">',
        },
      }),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.message).toBe('Validation failed')
    expect(response.data.error?.cause?.message).toBe(
      'One or more fields failed validation',
    )
  })

  it('should accept clean text without HTML in all fields', async () => {
    const cleanPayload = {
      walletAddress: 'https://example.com/wallet',
      profileId: 'version1',
      tool: 'widget',
      profile: {
        ...widgetProfilePayload,
      },
    }

    mockRequest = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    })

    const response = await action({
      request: mockRequest,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect(response.data.error).toBeUndefined()
  })
})
