import { mockClient } from 'aws-sdk-client-mock'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import { S3MigrationClient } from '../index'

const s3Mock = mockClient(S3Client)

const BUCKET = 'test-bucket'
const LEGACY_PREFIX = 'legacy-prefix'
const NEW_PREFIX = 'new-prefix'

const mockConfig = {
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  bucket: BUCKET,
  endpoint: 'https://s3.example.com',
}

function makeLegacyData() {
  return {
  version1: {
    versionName: 'Default',
    walletAddress: '$wallet.example.com',
    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: 'Light',
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#000000',
    bannerFontName: 'Arial',
    bannerFontSize: 20,
    bannerTitleText: 'Support my work',
    bannerDescriptionText: 'Thank you',
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
  }
}

function mockBody(data: unknown) {
  return {
    transformToString: async () => JSON.stringify(data),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

let s3: S3MigrationClient

beforeEach(() => {
  s3Mock.reset()
  s3 = new S3MigrationClient(mockConfig)
})

// -- getJson ------------------------------------------------------------------

describe('getJson', () => {
  it('uses the given key', async () => {
    s3Mock.on(GetObjectCommand).resolves({ Body: mockBody(makeLegacyData()) })

    await s3.getJson(`${LEGACY_PREFIX}/wallet.example.com.json`)

    const [call] = s3Mock.commandCalls(GetObjectCommand)
    expect(call!.args[0].input.Bucket).toBe(BUCKET)
    expect(call!.args[0].input.Key).toBe(
      `${LEGACY_PREFIX}/wallet.example.com.json`,
    )
  })

  it('returns parsed JSON from the response body', async () => {
    s3Mock.on(GetObjectCommand).resolves({ Body: mockBody(makeLegacyData()) })

    const result = await s3.getJson(`${LEGACY_PREFIX}/wallet.example.com.json`)

    expect(result).toEqual(makeLegacyData())
  })

  it('returns null for a 404 S3ServiceException', async () => {
    s3Mock.on(GetObjectCommand).rejects(
      new S3ServiceException({
        name: 'NoSuchKey',
        $fault: 'client',
        $metadata: { httpStatusCode: 404 },
      }),
    )

    await expect(
      s3.getJson(`${LEGACY_PREFIX}/wallet.example.com.json`),
    ).resolves.toBeNull()
  })
})

// -- putJson ------------------------------------------------------------------

describe('putJson', () => {
  it('uses the given key', async () => {
    s3Mock.on(PutObjectCommand).resolves({})

    await s3.putJson(`${NEW_PREFIX}/wallet.example.com.json`, makeLegacyData())

    const [call] = s3Mock.commandCalls(PutObjectCommand)
    expect(call!.args[0].input.Bucket).toBe(BUCKET)
    expect(call!.args[0].input.Key).toBe(
      `${NEW_PREFIX}/wallet.example.com.json`,
    )
  })
})

// -- listByPrefix -------------------------------------------------------------

describe('listByPrefix', () => {
  it('uses the given prefix', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] })

    await s3.listByPrefix(LEGACY_PREFIX)

    const [call] = s3Mock.commandCalls(ListObjectsV2Command)
    expect(call!.args[0].input.Bucket).toBe(BUCKET)
    expect(call!.args[0].input.Prefix).toBe(`${LEGACY_PREFIX}/`)
  })

  it('returns raw S3 keys', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: `${LEGACY_PREFIX}/wallet.example.com.json` },
        { Key: `${LEGACY_PREFIX}/other.example.com.json` },
      ],
    })

    const result = await s3.listByPrefix(LEGACY_PREFIX)

    expect(result).toEqual([
      `${LEGACY_PREFIX}/wallet.example.com.json`,
      `${LEGACY_PREFIX}/other.example.com.json`,
    ])
  })

  it('returns empty array when no objects exist', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] })
    expect(await s3.listByPrefix(LEGACY_PREFIX)).toEqual([])
  })
})

// -- existsAt -----------------------------------------------------------------

describe('existsAt', () => {
  it('returns false for a 404 S3ServiceException', async () => {
    s3Mock.on(HeadObjectCommand).rejects(
      new S3ServiceException({
        name: 'NotFound',
        $fault: 'client',
        $metadata: { httpStatusCode: 404 },
      }),
    )
    expect(await s3.existsAt(`${NEW_PREFIX}/wallet.example.com.json`)).toBe(
      false,
    )
  })

  it('checks the given prefix key', async () => {
    s3Mock.on(HeadObjectCommand).resolves({})

    await s3.existsAt(`${NEW_PREFIX}/wallet.example.com.json`)

    const [call] = s3Mock.commandCalls(HeadObjectCommand)
    expect(call!.args[0].input.Key).toBe(
      `${NEW_PREFIX}/wallet.example.com.json`,
    )
  })
})

// -- deleteAt -----------------------------------------------------------------

describe('deleteAt', () => {
  it('uses the given key', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({})

    await s3.deleteAt(`${LEGACY_PREFIX}/wallet.example.com.json`)

    const [call] = s3Mock.commandCalls(DeleteObjectCommand)
    expect(call!.args[0].input.Bucket).toBe(BUCKET)
    expect(call!.args[0].input.Key).toBe(
      `${LEGACY_PREFIX}/wallet.example.com.json`,
    )
  })
})
