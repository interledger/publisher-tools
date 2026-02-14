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

  async getJson<T>(walletAddress: string): Promise<T> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.prefix}/${key}`, this.endpoint)

    const response = await this.client.fetch(url)

    if (!response.ok) {
      throw new Error(`S3 request failed with status: ${response.status}`)
    }

    return await response.json()
  }

  /** @legacy */
  async getLegacyJson<T>(walletAddress: string): Promise<T> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.LEGACY_AWS_PREFIX}/${key}`, this.endpoint)

    const response = await this.client.fetch(url)

    if (!response.ok) {
      throw new Error(`S3 request failed with status: ${response.status}`)
    }

    return await response.json()
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
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}
