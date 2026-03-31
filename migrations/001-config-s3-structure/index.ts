import { AwsClient } from 'aws4fetch'
import { XMLParser } from 'fast-xml-parser'
import type { ConfigVersions, Configuration } from '@shared/types'
import { urlWithParams } from '@shared/utils'

const xmlParser = new XMLParser()

interface Env {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_S3_ENDPOINT: string
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}

function keyToWalletAddress(key: string): string {
  // remove prefix and .json suffix, then reconstruct the wallet address
  return `https://${key.replace(/^[^/]+\//, '').replace(/\.json$/, '')}`
}

export class ConfigMigrationService {
  private readonly LEGACY_AWS_PREFIX = '20250717-dev'
  private readonly NEW_AWS_PREFIX = '20260305-dev'
  private static instance: AwsClient | null = null
  private client: AwsClient
  private endpoint: string

  constructor(env: Env) {
    ConfigMigrationService.instance ??= new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    })
    this.endpoint = env.AWS_S3_ENDPOINT
    this.client = ConfigMigrationService.instance
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
    const url = new URL(`${this.NEW_AWS_PREFIX}/${key}`, this.endpoint)
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

  async listLegacyWallets(): Promise<string[]> {
    // list all wallet keys under the legacy prefix
    const url = urlWithParams(this.endpoint, {
      'list-type': '2',
      'prefix': `${this.LEGACY_AWS_PREFIX}/`,
    })

    const response = await this.client.fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to list S3 objects: ${response.status}`)
    }

    // we use aws4fetch raw signed HTTP, so we need to parse the XML response manually to extract the keys
    const result = xmlParser.parse(await response.text()).ListBucketResult

    const keys: string[] = Array.isArray(result.Contents)
      ? result.Contents.map((c: { Key: string }) => c.Key)
      : result.Contents
        ? [result.Contents.Key]
        : []

    return keys.map(keyToWalletAddress)
  }

  async existsInNewPrefix(walletAddress: string): Promise<boolean> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.NEW_AWS_PREFIX}/${key}`, this.endpoint)
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
}
