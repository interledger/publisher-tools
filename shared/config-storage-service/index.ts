import { AwsClient } from 'aws4fetch'

interface Secrets {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_S3_ENDPOINT: string
  AWS_PREFIX: string
}

export class ConfigStorageService {
  /** TODO: to be removed after the completion of versioned config migration */
  private readonly LEGACY_AWS_PREFIX = '20250717-dev'
  private static instance: AwsClient | null = null
  private client: AwsClient
  private prefix: string
  private endpoint: string

  constructor(env: Secrets) {
    ConfigStorageService.instance ??= new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    })
    this.endpoint = env.AWS_S3_ENDPOINT

    this.prefix = env.AWS_PREFIX
    this.client = ConfigStorageService.instance
  }

  async getJson<T>(walletAddress: string, useLegacy = false): Promise<T> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(
      `${useLegacy ? this.LEGACY_AWS_PREFIX : this.prefix}/${key}`,
      this.endpoint,
    )

    const response = await this.client.fetch(url)

    if (!response.ok) {
      const { status } = response
      if (status === 404) {
        const msg = 'File not found'
        throw new ConfigStorageServiceError('not-found', status, msg)
      }
      const msg = 'S3 request failed'
      throw new ConfigStorageServiceError('unknown', status, msg)
    }

    const json = await response.json()
    if (typeof json !== 'object' || !json) {
      const msg = 'Invalid JSON response from S3'
      throw new ConfigStorageServiceError('not-found', response.status, msg)
    }
    return json as T
  }

  async putJson<T>(walletAddress: string, data: T): Promise<void> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.prefix}/${key}`, this.endpoint)
    const jsonString = JSON.stringify(data)

    const response = await this.client.fetch(url, {
      method: 'PUT',
      body: jsonString,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.status}`)
    }
  }

  async delete(walletAddress: string, useLegacy = false): Promise<void> {
    const key = walletAddressToKey(walletAddress)
    const prefix = useLegacy ? this.LEGACY_AWS_PREFIX : this.prefix
    const url = new URL(`${prefix}/${key}`, this.endpoint)

    const res = await this.client.fetch(url, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error(`Failed to delete from S3: ${res.status}`)
    }
  }
}

export const isConfigStorageNotFoundError = (
  err: unknown,
): err is ConfigStorageServiceError => {
  return err instanceof ConfigStorageServiceError && err.code === 'not-found'
}

export class ConfigStorageServiceError extends Error {
  constructor(
    public readonly code: 'not-found' | 'unknown',
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ConfigStorageError'
  }
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}
