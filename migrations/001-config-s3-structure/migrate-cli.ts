import { S3MigrationClient } from '@migration/s3'
import type { ConfigVersions } from '@shared/types'
import { convertToConfiguration } from '@shared/utils/profile-converter'
import { MigrationLog } from './migration-log'

const LEGACY_PREFIX = '20250717-dev'
const NEW_PREFIX = '20260305-dev'

export interface MigrationClient {
  getJson<T>(prefix: string, walletAddress: string): Promise<T | null>
  putJson<T>(prefix: string, walletAddress: string, data: T): Promise<void>
  listByPrefix(prefix: string): Promise<string[]>
  existsAt(prefix: string, walletAddress: string): Promise<boolean>
  deleteAt(prefix: string, walletAddress: string): Promise<void>
}

export function createDryRunClient(client: MigrationClient): MigrationClient {
  return {
    getJson: (prefix, w) => client.getJson(prefix, w),
    existsAt: (prefix, w) => client.existsAt(prefix, w),
    listByPrefix: (prefix) => client.listByPrefix(prefix),
    putJson: () => Promise.resolve(),
    deleteAt: (prefix, w) => {
      console.log(`[DRY RUN] would deleteAt: ${prefix}/${w}`)
      return Promise.resolve()
    },
  }
}

interface CliOptions {
  wallet?: string
  batch: boolean
  dryRun: boolean
}

export function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = { batch: false, dryRun: false }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--wallet':
      case '-w':
        options.wallet = args[++i]
        break
      case '--batch':
      case '-b':
        options.batch = true
        break
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
      // eslint-disable-next-line no-fallthrough
      default:
        console.error(`Unknown option: ${args[i]}`)
        printHelp()
        process.exit(1)
    }
  }

  return options
}

function printHelp() {
  console.log(`
Usage:
  migrate-cli.ts [options]

Options:
  --wallet, -w <address>                          Migrate a single wallet address
  --batch, -b                                     Migrate all wallets found in the legacy S3 prefix
  --dry-run --wallet <address>                    Preview migration for a single wallet without making changes
  --dry-run --batch                               Preview migration for all wallets without making changes; implies --batch when --wallet is omitted,
  --help, -h                                      Show this help message

Examples:
  # Migrate a single wallet
  node migrate-cli.ts --wallet "https://ilp.interledger-test.dev/darianusd"

  # Migrate all wallets from the legacy prefix
  node migrate-cli.ts --batch

  # Dry run a single wallet
  node migrate-cli.ts --wallet "https://ilp.interledger-test.dev/darianusd" --dry-run

  # Dry run all wallets (--dry-run without --wallet implies batch)
  node migrate-cli.ts --dry-run
`)
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
    console.error('Error: Missing required environment variables:')
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
  try {
    if (await s3.existsAt(NEW_PREFIX, walletAddress)) {
      await s3.deleteAt(LEGACY_PREFIX, walletAddress)
      return false
    }

    const legacyData = await s3.getJson<ConfigVersions>(
      LEGACY_PREFIX,
      walletAddress,
    )
    if (!legacyData) {
      console.log('! No legacy data found - skipping')
      return false
    }
    const newData = convertToConfiguration(legacyData, walletAddress)
    await s3.putJson(NEW_PREFIX, walletAddress, newData)

    return true
  } catch (error) {
    console.error('x Migration failed:', (error as Error).message)
    throw error
  }
}

async function migrateBatch(
  s3: MigrationClient,
  isDryRun: boolean,
): Promise<void> {
  const wallets = await s3.listByPrefix(LEGACY_PREFIX)
  if (wallets.length === 0) {
    console.log('x No wallets found in legacy prefix')
    return
  }

  const log = new MigrationLog(isDryRun)
  console.log(`\nStarting batch migration for ${wallets.length} wallets...`)

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

  log.save()
  if (log.hasFailed) {
    process.exit(1)
  }
}

async function main() {
  const { wallet, batch, dryRun: isDryRun } = parseArgs()
  const isBatch = batch || (!wallet && isDryRun)

  if (!wallet && !isBatch) {
    console.error('Note: Either --wallet or --batch must be specified')
    printHelp()
    process.exit(1)
  }

  validateEnv()

  console.log('='.repeat(50))
  console.log(`[DRY RUN]: ${isDryRun ? 'Yes' : 'No'}`)
  console.log('='.repeat(50))

  const client = setupClient()
  const s3: MigrationClient = isDryRun ? createDryRunClient(client) : client

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
}

// only run main CLI if this file executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
