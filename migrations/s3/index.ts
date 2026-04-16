import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'

export interface S3Config {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region?: string
  endpoint?: string
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

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      )

      const body = await res.Body?.transformToString()
      if (!body) return null

      return JSON.parse(body) as T
    } catch (err) {
      if (err instanceof S3ServiceException) {
        if (err.$metadata?.httpStatusCode === 404) return null
      }
      throw err
    }
  }

  async putJson<T>(key: string, data: T): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
      }),
    )
  }

  async listByPrefix(prefix: string): Promise<string[]> {
    const keys: string[] = []
    let continuationToken: string | undefined

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `${prefix}/`,
          ContinuationToken: continuationToken,
        }),
      )

      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key)
      }

      continuationToken = res.NextContinuationToken
    } while (continuationToken)

    return keys
  }

  async existsAt(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      )
      return true
    } catch (err) {
      if (err instanceof S3ServiceException) {
        if (err.$metadata?.httpStatusCode === 404) return false
      }
      throw err
    }
  }

  async deleteAt(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    )
  }
}
