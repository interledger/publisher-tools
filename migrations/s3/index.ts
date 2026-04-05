import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'

export const LEGACY_PREFIX = '20250717-dev'
export const NEW_PREFIX = '20260305-dev'

export interface S3Config {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region?: string
  endpoint?: string
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}

function keyToWalletAddress(key: string): string {
  return `https://${key.replace(/^[^/]+\//, '').replace(/\.json$/, '')}`
}

export class S3MigrationClient {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: S3Config) {
    this.bucket = config.bucket

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && {
        endpoint: config.endpoint,
        forcePathStyle: true,
      }),
    })
  }

  private buildKey(prefix: string, walletAddress: string): string {
    return `${prefix}/${walletAddressToKey(walletAddress)}`
  }

  async getJson<T>(walletAddress: string): Promise<T | null> {
    const key = this.buildKey(LEGACY_PREFIX, walletAddress)

    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )

      const body = await res.Body?.transformToString()

      if (!body) return null

      return JSON.parse(body) as T
    } catch (err) {
      if (err instanceof S3ServiceException) {
        if (err.$metadata?.httpStatusCode === 404) {
          return null
        }
      }
      throw err
    }
  }

  async putJson<T>(walletAddress: string, data: T): Promise<void> {
    const key = this.buildKey(NEW_PREFIX, walletAddress)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
      }),
    )
  }

  async listLegacyWallets(): Promise<string[]> {
    const keys: string[] = []
    let continuationToken: string | undefined

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `${LEGACY_PREFIX}/`,
          ContinuationToken: continuationToken,
        }),
      )

      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key)
      }

      continuationToken = res.NextContinuationToken
    } while (continuationToken)

    return keys.map(keyToWalletAddress)
  }

  async existsInNewPrefix(walletAddress: string): Promise<boolean> {
    const key = this.buildKey(NEW_PREFIX, walletAddress)

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return true
    } catch (err) {
      if (err instanceof S3ServiceException) {
        if (err.$metadata?.httpStatusCode === 404) {
          return false
        }
      }

      throw err
    }
  }

  async deleteFromLegacy(walletAddress: string): Promise<void> {
    const key = this.buildKey(LEGACY_PREFIX, walletAddress)

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )
  }
}
