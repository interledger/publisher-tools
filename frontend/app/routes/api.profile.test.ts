import type { ActionFunctionArgs } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BannerProfile, WidgetProfile } from '@shared/types'
import { INVALID_PAYLOAD_ERROR } from '~/lib/helpers'
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
  let mockContext: ActionFunctionArgs['context']

  const bannerProfilePayload: BannerProfile = {
    $version: '1.0.0',
    $name: 'test-profile',
    title: {
      text: 'Fund me',
    },
    description: {
      text: 'Support our work',
      isVisible: true,
    },
    position: 'Top',
    animation: {
      type: 'Slide',
    },
    border: {
      type: 'Light',
    },
    font: {
      name: 'Arial',
      size: '2xs',
    },
    color: {
      text: '#000000',
      background: '#ffffff',
    },
    thumbnail: {
      value: 'default',
    },
  }
  const widgetProfilePayload: WidgetProfile = {
    $version: '1.0.0',
    $name: 'ilf-profile',
    title: {
      text: 'Support',
    },
    description: {
      text: 'Web Monetization in your browser.',
      isVisible: true,
    },
    position: 'Right',
    border: {
      type: 'Light',
    },
    font: {
      name: 'Arial',
      size: 'base',
    },
    color: {
      text: '#000',
      background: '#ffffff',
      theme: '#4ec6c0',
    },
    ctaPayButton: {
      text: 'Support Me',
    },
    icon: {
      value: '/path/to/icon',
      color: '#000',
    },
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
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          title: { text: '<script>alert("XSS")</script>' },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject HTML injection in widget description field', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          description: {
            text: '<img src=x onerror="alert(\'XSS\')">Please support our work',
            isVisible: false,
          },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject event handler attributes in banner title', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          title: {
            text: '<div onclick="stealData()">Click Here</div>',
          },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject encoded HTML entities in banner description', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          description: {
            text: '&lt;iframe src=&quot;https://evil.com&quot;&gt;&lt;/iframe&gt;',
            isVisible: true,
          },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject HTML in widget title text field', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          title: { text: '<b>Click Here</b>' },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject HTML in widget version name field', async () => {
    const request = new Request('https://example.com/api/profile', {
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
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject HTML in banner version name field', async () => {
    const request = new Request('https://example.com/api/profile', {
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
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.errors).toEqual({
      reason: INVALID_PAYLOAD_ERROR,
    })
  })

  it('should reject malicious widgetBackgroundColor via Zod validation', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'widget',
        profile: {
          ...widgetProfilePayload,
          color: { text: '<script>alert("XSS")</script>' },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.message).toEqual(INVALID_PAYLOAD_ERROR)
  })

  it('should reject malicious bannerTextColor via Zod validation', async () => {
    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'https://example.com/wallet',
        profileId: 'version1',
        tool: 'banner',
        profile: {
          ...bannerProfilePayload,
          color: {
            ...bannerProfilePayload.color,
            text: '<img src=x onerror="stealCookies()">',
          },
        },
      }),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(400)
    expect(response.data.error?.cause?.message).toEqual(INVALID_PAYLOAD_ERROR)
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

    const request = new Request('https://example.com/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    })

    const response = await action({
      request,
      context: mockContext,
    } as ActionFunctionArgs)

    expect(response.init?.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect(response.data.error).toBeUndefined()
  })
})
