import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ConfigVersions, Configuration } from '@shared/types'
import { convertToConfiguration } from '../../frontend/app/utils/profile-converter'
import { ConfigMigrationService } from '../index'

const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('aws4fetch', () => ({
  AwsClient: vi.fn().mockImplementation(() => ({ fetch: mockFetch })),
}))

const mockSecrets = {
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  AWS_S3_ENDPOINT: 'https://s3.example.com',
  AWS_PREFIX: '20260126-dev',
}

const LEGACY_AWS_PREFIX = '20250717-dev'

/** Full legacy profile — all banner + widget fields populated */
const mockLegacyData: ConfigVersions = {
  version1: {
    versionName: 'Default profile 1',
    walletAddress: '$wallet.example.com',
    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: 'Light',
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#000000',
    bannerFontName: 'Arial',
    bannerFontSize: 20,
    bannerTitleText: 'Support my work',
    bannerDescriptionText: 'Thank you for your support',
    bannerDescriptionVisible: true,
    bannerSlideAnimation: 'Slide',
    bannerPosition: 'Top',
    bannerBorder: 'Light',
    bannerTextColor: '#333333',
    bannerBackgroundColor: '#f0f0f0',
    bannerThumbnail: '',
    widgetFontName: 'Arial',
    widgetFontSize: 16,
    widgetTitleText: 'Support',
    widgetDescriptionText: 'Help keep this site running',
    widgetDescriptionVisible: true,
    widgetPosition: 'Right',
    widgetDonateAmount: 5,
    widgetButtonText: 'Donate',
    widgetButtonBorder: 'Pill',
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetButtonTextColor: '#ffffff',
    widgetButtonBackgroundColor: '#007bff',
    widgetTriggerBackgroundColor: '#007bff',
    widgetTriggerIcon: 'heart',
  },
  version3: {
    versionName: 'Dark theme',
    walletAddress: '$wallet.example.com',
    buttonFontName: 'Roboto',
    buttonText: 'Donate',
    buttonBorder: 'Pill',
    buttonTextColor: '#000000',
    buttonBackgroundColor: '#ffffff',
    bannerFontName: 'Roboto',
    bannerFontSize: 14,
    bannerTitleText: 'Help us grow',
    bannerDescriptionText: 'Every contribution counts',
    bannerDescriptionVisible: false,
    bannerSlideAnimation: 'None',
    bannerPosition: 'Bottom',
    bannerBorder: 'None',
    bannerTextColor: '#ffffff',
    bannerBackgroundColor: '#1a1a1a',
    bannerThumbnail: 'https://cdn.example.com/thumb.png',
    widgetFontName: 'Roboto',
    widgetFontSize: 14,
    widgetTitleText: 'Tip jar',
    widgetDescriptionText: 'Support independent work',
    widgetDescriptionVisible: false,
    widgetPosition: 'Left',
    widgetDonateAmount: 10,
    widgetButtonText: 'Give',
    widgetButtonBorder: 'Light',
    widgetTextColor: '#ffffff',
    widgetBackgroundColor: '#1a1a1a',
    widgetButtonTextColor: '#000000',
    widgetButtonBackgroundColor: '#f5c518',
    widgetTriggerBackgroundColor: '#f5c518',
    widgetTriggerIcon: 'star',
  },
}

const mockNewConfiguration: Configuration = {
  $walletAddress: '$wallet.example.com',
  $walletAddressId: '$wallet.example.com',
  $createdAt: '2026-01-29T12:00:00.000Z',
  $modifiedAt: '2026-01-29T12:00:00.000Z',
  banner: {
    version1: {
      $version: '0.0.1',
      $name: 'Default profile 1',
      $modifiedAt: '2026-01-29T12:00:00.000Z',
      title: { text: 'Support my work' },
      description: { text: 'Thank you for your support', isVisible: true },
      font: { name: 'Arial', size: 'base' },
      animation: { type: 'Slide' },
      position: 'Top',
      border: { type: 'Light' },
      color: { text: '#333333', background: '#f0f0f0' },
      thumbnail: { value: '' },
    },
    version3: {
      $version: '0.0.1',
      $name: 'Dark theme',
      $modifiedAt: '2026-01-29T12:00:00.000Z',
      title: { text: 'Help us grow' },
      description: { text: 'Every contribution counts', isVisible: false },
      font: { name: 'Roboto', size: '2xs' },
      animation: { type: 'None' },
      position: 'Bottom',
      border: { type: 'None' },
      color: { text: '#ffffff', background: '#1a1a1a' },
      thumbnail: { value: 'https://cdn.example.com/thumb.png' },
    },
  },
  widget: {
    version1: {
      $version: '0.0.1',
      $name: 'Default profile 1',
      $modifiedAt: '2026-01-29T12:00:00.000Z',
      title: { text: 'Support' },
      description: { text: 'Help keep this site running', isVisible: true },
      font: { name: 'Arial', size: 'md' },
      position: 'Right',
      border: { type: 'Pill' },
      color: { text: '#000000', background: '#ffffff', theme: '#007bff' },
      ctaPayButton: { text: 'Donate' },
      icon: { value: '', color: '#007bff' },
    },
    version3: {
      $version: '0.0.1',
      $name: 'Dark theme',
      $modifiedAt: '2026-01-29T12:00:00.000Z',
      title: { text: 'Tip jar' },
      description: { text: 'Support independent work', isVisible: false },
      font: { name: 'Roboto', size: 'xs' },
      position: 'Left',
      border: { type: 'Light' },
      color: { text: '#ffffff', background: '#1a1a1a', theme: '#f5c518' },
      ctaPayButton: { text: 'Give' },
      icon: { value: '', color: '#f5c518' },
    },
  },
}

// -- getJson / putJson ----------------------------------------------------

describe('ConfigMigrationService - getJson / putJson', () => {
  let service: ConfigMigrationService

  beforeEach(() => {
    vi.clearAllMocks()

    service = new ConfigMigrationService(mockSecrets)
  })

  it('should successfully fetch and return legacy ConfigVersions data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockLegacyData,
    })

    const result = await service.getJson('$wallet.example.com')

    expect(result).toEqual(mockLegacyData)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0][0].href).toContain(LEGACY_AWS_PREFIX)
    expect(mockFetch.mock.calls[0][0].href).toContain('wallet.example.com.json')
  })

  it('should construct correct S3 URL with legacy prefix in getJson', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockLegacyData,
    })

    await service.getJson('https://wallet.example.com')

    expect(mockFetch.mock.calls[0][0].href).toBe(
      `${mockSecrets.AWS_S3_ENDPOINT}/${LEGACY_AWS_PREFIX}/wallet.example.com.json`,
    )
  })

  it('should strip https:// prefix from wallet address in getJson', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockLegacyData,
    })

    await service.getJson('https://wallet.example.com')

    const url = mockFetch.mock.calls[0][0].href
    expect(url).toContain('wallet.example.com.json')
    expect(url).not.toContain('https://wallet')
  })

  it('should throw NoSuchKey error on 404', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    try {
      await service.getJson('$wallet.example.com')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('404')
      expect((error as Error).name).toBe('NoSuchKey')
    }
  })

  it('should upload Configuration to new prefix with PUT', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

    await service.putJson('$wallet.example.com', mockNewConfiguration)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url.href).toContain(mockSecrets.AWS_PREFIX)
    expect(url.href).toContain('wallet.example.com.json')
    expect(opts.method).toBe('PUT')
    expect(opts.headers['Content-Type']).toBe('application/json')
  })

  it('should construct correct S3 URL with new prefix in putJson', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

    await service.putJson('https://wallet.example.com', mockNewConfiguration)

    expect(mockFetch.mock.calls[0][0].href).toBe(
      `${mockSecrets.AWS_S3_ENDPOINT}/${mockSecrets.AWS_PREFIX}/wallet.example.com.json`,
    )
  })

  it('should strip $ prefix from wallet address in putJson', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

    await service.putJson('$wallet.example.com', mockNewConfiguration)

    const url = mockFetch.mock.calls[0][0].href
    expect(url).toContain('wallet.example.com.json')
    expect(url).not.toContain('$')
  })
})

describe('ConfigMigrationService - migrate', () => {
  let service: ConfigMigrationService

  beforeEach(() => {
    vi.clearAllMocks()

    service = new ConfigMigrationService(mockSecrets)
  })

  // -- happy path -----------------------------------------------------------

  it('should HEAD new prefix, then GET legacy, PUT new, DELETE legacy', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request to check if already migrated
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', convertToConfiguration)

    expect(mockFetch).toHaveBeenCalledTimes(4)
    expect(mockFetch.mock.calls[0][0].href).toContain(mockSecrets.AWS_PREFIX)
    expect(mockFetch.mock.calls[0][1].method).toBe('HEAD')
    expect(mockFetch.mock.calls[1][0].href).toContain(LEGACY_AWS_PREFIX)
    expect(mockFetch.mock.calls[2][0].href).toContain(mockSecrets.AWS_PREFIX)
    expect(mockFetch.mock.calls[2][1].method).toBe('PUT')
    expect(mockFetch.mock.calls[3][0].href).toContain(LEGACY_AWS_PREFIX)
    expect(mockFetch.mock.calls[3][1].method).toBe('DELETE')
  })

  it('should call converter with legacy data and walletAddress', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    const converter = vi.fn(convertToConfiguration)
    await service.migrate('$wallet.example.com', converter)

    expect(converter).toHaveBeenCalledTimes(1)
    expect(converter).toHaveBeenCalledWith(
      mockLegacyData,
      '$wallet.example.com',
    )
  })

  it('should preserve banner fields in the uploaded data', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', convertToConfiguration)

    const body = JSON.parse(mockFetch.mock.calls[2][1].body)
    const v1 = mockLegacyData.version1
    expect(body.$walletAddress).toBe('$wallet.example.com')
    expect(body.banner.version1.$name).toBe(v1.versionName)
    expect(body.banner.version1.title.text).toBe(v1.bannerTitleText)
    expect(body.banner.version1.description.text).toBe(v1.bannerDescriptionText)
    expect(body.banner.version1.description.isVisible).toBe(
      v1.bannerDescriptionVisible,
    )
    expect(body.banner.version1.color.text).toBe(v1.bannerTextColor)
    expect(body.banner.version1.color.background).toBe(v1.bannerBackgroundColor)
    expect(body.banner.version1.position).toBe(v1.bannerPosition)
    expect(body.banner.version1.border.type).toBe(v1.bannerBorder)
    expect(body.banner.version1.thumbnail.value).toBe(v1.bannerThumbnail)
  })

  it('should preserve widget fields in the uploaded data', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', convertToConfiguration)

    const body = JSON.parse(mockFetch.mock.calls[2][1].body)
    const v1 = mockLegacyData.version1
    expect(body.widget.version1.title.text).toBe(v1.widgetTitleText)
    expect(body.widget.version1.description.text).toBe(v1.widgetDescriptionText)
    expect(body.widget.version1.description.isVisible).toBe(
      v1.widgetDescriptionVisible,
    )
    expect(body.widget.version1.position).toBe(v1.widgetPosition)
    expect(body.widget.version1.color.text).toBe(v1.widgetTextColor)
    expect(body.widget.version1.color.background).toBe(v1.widgetBackgroundColor)
  })

  // -- full pipeline ----------------------------------------------------------

  it('should produce the correct Configuration shape from legacy data', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-29T12:00:00.000Z'))

    try {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockLegacyData,
        }) // GET request
        .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
        .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

      await service.migrate('$wallet.example.com', convertToConfiguration)

      const body = JSON.parse(mockFetch.mock.calls[2][1].body)

      expect(body).toEqual(mockNewConfiguration)
    } finally {
      vi.useRealTimers()
    }
  })

  // -- multiple versions ----------------------------------------------------

  it('should migrate all profile versions from a multi-version legacy config', async () => {
    const multi: ConfigVersions = {
      version1: { ...mockLegacyData.version1, versionName: 'Profile 1' },
      version3: { ...mockLegacyData.version3, versionName: 'Profile 3' },
    }

    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => multi,
      }) // GET request
      .mockResolvedValueOnce({ ok: true, status: 200 }) // PUT request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', convertToConfiguration)

    const body = JSON.parse(mockFetch.mock.calls[2][1].body)
    expect(Object.keys(body.banner)).toHaveLength(2)
    expect(body.banner.version1.$name).toBe('Profile 1')
    expect(body.widget.version3.$name).toBe('Profile 3')
  })

  // -- already migrated -----------------------------------------------------

  it('should skip migration and only delete legacy key if new prefix already has the key', async () => {
    const converter = vi.fn(convertToConfiguration)

    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 }) // HEAD request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', converter)

    expect(converter).not.toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][1].method).toBe('HEAD')
    expect(mockFetch.mock.calls[1][0].href).toContain(LEGACY_AWS_PREFIX)
    expect(mockFetch.mock.calls[1][1].method).toBe('DELETE')
  })

  it('should use the correct key URL when checking for an already-migrated wallet', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 }) // HEAD request
      .mockResolvedValueOnce({ ok: true, status: 204 }) // DELETE request

    await service.migrate('$wallet.example.com', convertToConfiguration)

    expect(mockFetch.mock.calls[0][0].href).toBe(
      `${mockSecrets.AWS_S3_ENDPOINT}/${mockSecrets.AWS_PREFIX}/wallet.example.com.json`,
    )
  })

  // -- error cases ----------------------------------------------------------

  it('should not call putJson if getJson fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({ ok: false, status: 404 }) // GET request

    await expect(
      service.migrate('$wallet.example.com', convertToConfiguration),
    ).rejects.toThrow('404')

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should not call putJson if converter throws', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request

    const converter = (): never => {
      throw new Error('Conversion failed')
    }

    await expect(
      service.migrate('$wallet.example.com', converter),
    ).rejects.toThrow('Conversion failed')

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should throw if putJson fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: false, status: 500 }) // PUT request

    await expect(
      service.migrate('$wallet.example.com', convertToConfiguration),
    ).rejects.toThrow('Failed to upload to S3: 500')

    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should not call delete if putJson fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 }) // HEAD request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLegacyData,
      }) // GET request
      .mockResolvedValueOnce({ ok: false, status: 500 }) // PUT request

    await expect(
      service.migrate('$wallet.example.com', convertToConfiguration),
    ).rejects.toThrow()

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch.mock.calls[2][1].method).toBe('PUT')
  })
})
