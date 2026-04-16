import sade from 'sade'
import { S3MigrationClient } from '@migration/s3'
import type { ConfigVersions } from '@shared/types'
import { convertToConfiguration } from '@shared/utils/profile-converter'
import { MigrationLog } from './migration-log'

const LEGACY_PREFIX = '20250717-dev'
const NEW_PREFIX = '20260305-dev'

function walletAddressToKey(prefix: string, walletAddress: string): string {
  const normalized = decodeURIComponent(walletAddress)
    .replace('$', '')
    .replace('https://', '')
  return `${prefix}/${normalized}.json`
}

function keyToWalletAddress(key: string): string {
  return `https://${key.replace(/^[^/]+\//, '').replace(/\.json$/, '')}`
}

export interface MigrationClient {
  getJson<T>(key: string): Promise<T | null>
  putJson<T>(key: string, data: T): Promise<void>
  listByPrefix(prefix: string): Promise<string[]>
  existsAt(key: string): Promise<boolean>
  deleteAt(key: string): Promise<void>
}

export function createDryRunClient(client: MigrationClient): MigrationClient {
  console.log('\n [DRY RUN]')
  return {
    getJson: (key) => client.getJson(key),
    existsAt: (key) => client.existsAt(key),
    listByPrefix: (prefix) => client.listByPrefix(prefix),
    putJson: () => Promise.resolve(),
    deleteAt: (key) => {
      console.log(`\n [DRY RUN] would deleteAt: ${key}`)
      return Promise.resolve()
    },
  }
}

function validateEnv() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_S3_REGION',
  ]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('\n Error: Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\n Please set these environment variables and try again.')
    process.exit(1)
  }
}

export function setupClient(): S3MigrationClient {
  return new S3MigrationClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    bucket: process.env.AWS_S3_BUCKET!,
    region: process.env.AWS_S3_REGION!,
    endpoint: process.env.AWS_S3_ENDPOINT,
  })
}

export async function migrateSingle(
  s3: MigrationClient,
  walletAddress: string,
): Promise<boolean> {
  const key = walletAddressToKey(NEW_PREFIX, walletAddress)
  const legacyKey = walletAddressToKey(LEGACY_PREFIX, walletAddress)
  try {
    if (await s3.existsAt(key)) {
      await s3.deleteAt(legacyKey)
      return false
    }

    const legacyData = await s3.getJson<ConfigVersions>(legacyKey)
    if (!legacyData) {
      console.log('\n ! No legacy data found - skipping')
      return false
    }
    const newData = convertToConfiguration(legacyData, walletAddress)
    await s3.putJson(key, newData)

    return true
  } catch (error) {
    console.error('\n x Migration failed:', (error as Error).message)
    throw error
  }
}

async function migrateBatch(
  s3: MigrationClient,
  isDryRun: boolean,
): Promise<void> {
  const wallets = (await s3.listByPrefix(LEGACY_PREFIX)).map(keyToWalletAddress)
  if (wallets.length === 0) {
    console.log('\n x No wallets found in legacy prefix')
    return
  }

  const log = new MigrationLog(isDryRun)
  console.log(`\n Starting batch migration for ${wallets.length} wallets...`)

  try {
    for (const wallet of wallets) {
      try {
        const migrated = await migrateSingle(s3, wallet)
        if (migrated) {
          log.recordSuccess(wallet)
        } else {
          log.recordSkipped(wallet)
        }
      } catch (error) {
        log.recordFailure(wallet, (error as Error).message)
      }
    }
  } finally {
    log.save()
  }

  if (log.hasFailed) {
    process.exit(1)
  }
}

if (import.meta.main) {
  // only run main cli if this file executed directly
  sade('migrate')
    .option('-w, --wallet <address>', 'Migrate a single wallet address')
    .option('-b, --batch', 'Migrate all wallets from the legacy S3 prefix')
    .option('-d, --dry-run', 'Preview migration without making changes')
    .example('--wallet "https://wallet.example.com/usd"')
    .example('--batch')
    .example('--wallet "https://wallet.example.com/usd" --dry-run')
    .example('--dry-run  # implies --batch when --wallet is omitted')
    .action(
      async (opts: {
        'wallet'?: string
        'batch': boolean
        'dry-run': boolean
      }) => {
        const { wallet, batch } = opts
        const isDryRun = opts['dry-run']
        const isBatch = batch || (!wallet && isDryRun)

        if (!wallet && !isBatch) {
          console.error('Note: Either --wallet or --batch must be specified')
          process.exit(1)
        }

        validateEnv()

        console.log('='.repeat(50))
        const client = setupClient()
        const s3: MigrationClient = isDryRun
          ? createDryRunClient(client)
          : client

        try {
          if (wallet) {
            await migrateSingle(s3, wallet)
            console.log('\n ✓ Migration complete')
            return
          }

          await migrateBatch(s3, isDryRun)
          console.log('\n ✓ Batch migration complete')
        } catch (error) {
          console.error('\n x Migration failed:', error)
          process.exit(1)
        }
      },
    )
    .parse(process.argv)
}
