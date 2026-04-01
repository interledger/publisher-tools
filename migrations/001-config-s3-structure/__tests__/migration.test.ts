import { describe, it, expect, beforeEach, vi } from 'vitest'
import { S3MigrationClient } from '@migration/s3'
import type { ConfigVersions, Configuration } from '@shared/types'
import { makeDryRunClient, migrateSingle } from '../migrate-cli'

const mockGetJson = vi.hoisted(() => vi.fn())
const mockPutJson = vi.hoisted(() => vi.fn())
const mockExistsInNewPrefix = vi.hoisted(() => vi.fn())
const mockDeleteFromLegacy = vi.hoisted(() => vi.fn())

vi.mock('@migration/s3', () => ({
  S3MigrationClient: vi.fn().mockImplementation(() => ({
    getJson: mockGetJson,
    putJson: mockPutJson,
    existsInNewPrefix: mockExistsInNewPrefix,
    deleteFromLegacy: mockDeleteFromLegacy,
    listLegacyWallets: vi.fn(),
  })),
  LEGACY_PREFIX: '20250717-dev',
  NEW_PREFIX: '20260305-dev',
}))

const WALLET = '$wallet.example.com'

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

// fake instance — the mock above intercepts all method calls
const s3 = new S3MigrationClient({
  accessKeyId: '',
  secretAccessKey: '',
  bucket: '',
})

// -- migrateSingle ------------------------------------------------------------

describe('migrateSingle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checks new prefix first, then gets legacy data, puts new, deletes legacy', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)
    mockPutJson.mockResolvedValueOnce(undefined)
    mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

    const result = await migrateSingle(s3, WALLET)

    expect(result).toBe(true)
    expect(mockExistsInNewPrefix).toHaveBeenCalledWith(WALLET)
    expect(mockGetJson).toHaveBeenCalledWith(WALLET)
    expect(mockPutJson).toHaveBeenCalledWith(
      WALLET,
      expect.objectContaining({ $walletAddress: WALLET }),
    )
    expect(mockDeleteFromLegacy).toHaveBeenCalledWith(WALLET)
  })

  it('produces the correct Configuration shape from legacy data', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-29T12:00:00.000Z'))

    try {
      mockExistsInNewPrefix.mockResolvedValueOnce(false)
      mockGetJson.mockResolvedValueOnce(mockLegacyData)
      mockPutJson.mockResolvedValueOnce(undefined)
      mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

      await migrateSingle(s3, WALLET)

      const [, uploaded] = mockPutJson.mock.calls[0] as [unknown, Configuration]
      expect(uploaded).toEqual(mockNewConfiguration)
    } finally {
      vi.useRealTimers()
    }
  })

  it('preserves banner fields in the uploaded data', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)
    mockPutJson.mockResolvedValueOnce(undefined)
    mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

    await migrateSingle(s3, WALLET)

    const [, uploaded] = mockPutJson.mock.calls[0] as [unknown, Configuration]
    const banner = uploaded.banner!
    const v1 = mockLegacyData.version1
    expect(uploaded.$walletAddress).toBe(WALLET)
    expect(banner.version1!.$name).toBe(v1.versionName)
    expect(banner.version1!.title.text).toBe(v1.bannerTitleText)
    expect(banner.version1!.description.text).toBe(v1.bannerDescriptionText)
    expect(banner.version1!.description.isVisible).toBe(
      v1.bannerDescriptionVisible,
    )
    expect(banner.version1!.color.text).toBe(v1.bannerTextColor)
    expect(banner.version1!.color.background).toBe(v1.bannerBackgroundColor)
    expect(banner.version1!.position).toBe(v1.bannerPosition)
    expect(banner.version1!.border.type).toBe(v1.bannerBorder)
    expect(banner.version1!.thumbnail.value).toBe(v1.bannerThumbnail)
  })

  it('preserves widget fields in the uploaded data', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)
    mockPutJson.mockResolvedValueOnce(undefined)
    mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

    await migrateSingle(s3, WALLET)

    const [, uploaded] = mockPutJson.mock.calls[0] as [unknown, Configuration]
    const widget = uploaded.widget!
    const v1 = mockLegacyData.version1
    expect(widget.version1!.title.text).toBe(v1.widgetTitleText)
    expect(widget.version1!.description.text).toBe(v1.widgetDescriptionText)
    expect(widget.version1!.description.isVisible).toBe(
      v1.widgetDescriptionVisible,
    )
    expect(widget.version1!.position).toBe(v1.widgetPosition)
    expect(widget.version1!.color.text).toBe(v1.widgetTextColor)
    expect(widget.version1!.color.background).toBe(v1.widgetBackgroundColor)
  })

  it('migrates all profile versions from a multi-version legacy config', async () => {
    const multi: ConfigVersions = {
      version1: { ...mockLegacyData.version1, versionName: 'Profile 1' },
      version3: { ...mockLegacyData.version3, versionName: 'Profile 3' },
    }

    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(multi)
    mockPutJson.mockResolvedValueOnce(undefined)
    mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

    await migrateSingle(s3, WALLET)

    const [, uploaded] = mockPutJson.mock.calls[0] as [unknown, Configuration]
    expect(Object.keys(uploaded.banner!)).toHaveLength(2)
    expect(uploaded.banner!.version1!.$name).toBe('Profile 1')
    expect(uploaded.widget!.version3!.$name).toBe('Profile 3')
  })

  it('skips get/put and only deletes legacy when already in new prefix', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(true)
    mockDeleteFromLegacy.mockResolvedValueOnce(undefined)

    const result = await migrateSingle(s3, WALLET)

    expect(result).toBe(true)
    expect(mockGetJson).not.toHaveBeenCalled()
    expect(mockPutJson).not.toHaveBeenCalled()
    expect(mockDeleteFromLegacy).toHaveBeenCalledWith(WALLET)
  })

  it('returns false and skips put/delete when getJson returns null', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(null)

    const result = await migrateSingle(s3, WALLET)

    expect(result).toBe(false)
    expect(mockPutJson).not.toHaveBeenCalled()
    expect(mockDeleteFromLegacy).not.toHaveBeenCalled()
  })

  it('does not delete legacy when putJson fails', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)
    mockPutJson.mockRejectedValueOnce(new Error('Upload failed'))

    await expect(migrateSingle(s3, WALLET)).rejects.toThrow('Upload failed')

    expect(mockDeleteFromLegacy).not.toHaveBeenCalled()
  })
})

// -- dry-run (via makeDryRunClient) -------------------------------------------

describe('migrateSingle (dry-run client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('never calls putJson or deleteFromLegacy on the real client', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)

    await migrateSingle(makeDryRunClient(s3), WALLET)

    expect(mockPutJson).not.toHaveBeenCalled()
    expect(mockDeleteFromLegacy).not.toHaveBeenCalled()
  })

  it('still reads from the real client', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(mockLegacyData)

    await migrateSingle(makeDryRunClient(s3), WALLET)

    expect(mockGetJson).toHaveBeenCalledWith(WALLET)
  })

  it('does not throw when getJson returns null', async () => {
    mockExistsInNewPrefix.mockResolvedValueOnce(false)
    mockGetJson.mockResolvedValueOnce(null)

    await expect(migrateSingle(makeDryRunClient(s3), WALLET)).resolves.toBe(false)
  })
})
