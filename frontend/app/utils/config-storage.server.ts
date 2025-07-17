import { AwsClient } from 'aws4fetch'
import { walletAddressToKey } from './utils.server.js'

type Secrets = Pick<
  Env,
  | 'AWS_ACCESS_KEY_ID'
  | 'AWS_SECRET_ACCESS_KEY'
  | 'AWS_REGION'
  | 'AWS_BUCKET_NAME'
  | 'AWS_PREFIX'
>

export class ConfigStorageService {
  private static instance: AwsClient | null = null
  private prefix: string
  private client: AwsClient
  private endpoint: string

  constructor(env: Secrets) {
    if (!ConfigStorageService.instance) {
      ConfigStorageService.instance = new AwsClient({
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION
      })
    }

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
