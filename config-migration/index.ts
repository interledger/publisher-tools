import { AwsClient } from 'aws4fetch'
import type { ConfigVersions, Configuration } from '@shared/types'

interface Env {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_S3_ENDPOINT: string
  AWS_PREFIX: string
}

export class ConfigMigrationService {
  private readonly LEGACY_AWS_PREFIX = '20250717-dev'
  private static instance: AwsClient | null = null
  private client: AwsClient
  private endpoint: string
  private prefix: string

  constructor(env: Env) {
    ConfigMigrationService.instance ??= new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    })
    this.endpoint = env.AWS_S3_ENDPOINT
    this.prefix = env.AWS_PREFIX
    this.client = ConfigMigrationService.instance
  }

  async getJson(walletAddress: string): Promise<ConfigVersions> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.LEGACY_AWS_PREFIX}/${key}`, this.endpoint)

    const response = await this.client.fetch(url)

    if (!response.ok) {
      const error = new Error(
        `S3 request failed with status: ${response.status}`,
      )
      if (response.status === 404) {
        error.name = 'NoSuchKey'
      }
      throw error
    }

    return await response.json()
  }

  async putJson(walletAddress: string, data: Configuration): Promise<void> {
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

  async existsInNewPrefix(walletAddress: string): Promise<boolean> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.prefix}/${key}`, this.endpoint)
    const response = await this.client.fetch(url, { method: 'HEAD' })
    return response.ok
  }

  async delete(walletAddress: string): Promise<void> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.LEGACY_AWS_PREFIX}/${key}`, this.endpoint)

    const res = await this.client.fetch(url, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error(`Failed to delete from S3: ${res.status}`)
    }
  }

  async migrate(
    walletAddress: string,
    converter: (legacy: ConfigVersions, walletAddress: string) => Configuration,
  ): Promise<void> {
    if (await this.existsInNewPrefix(walletAddress)) {
      await this.delete(walletAddress)
      return
    }

    const legacyData = await this.getJson(walletAddress)
    const newData = converter(legacyData, walletAddress)
    await this.putJson(walletAddress, newData)
    await this.delete(walletAddress)
  }
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}
