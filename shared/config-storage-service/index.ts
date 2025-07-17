import { AwsClient } from 'aws4fetch'

interface Secrets {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET_NAME: string
  AWS_PREFIX: string
}

export class ConfigStorageService {
  private static instance: AwsClient | null = null
  private client: AwsClient
  private prefix: string
  private endpoint: string

  constructor(env: Secrets) {
    ConfigStorageService.instance ??= new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION
    })

    this.prefix = env.AWS_PREFIX
    this.client = ConfigStorageService.instance
    this.endpoint = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`
  }

  async getJson<T>(walletAddress: string): Promise<T> {
    const key = walletAddressToKey(walletAddress)
    const url = new URL(`${this.prefix}/${key}`, this.endpoint)

    console.log(
      `!!!!!   Fetching config for wallet: ${walletAddress} from ${url}`
    )

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
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.status}`)
    }
  }
}

function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}
