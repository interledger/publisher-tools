import { pathToFileURL } from 'node:url'
import { S3MigrationClient } from '@migration/s3'
import type { ConfigVersions } from '@shared/types'
import { convertToConfiguration } from '@shared/utils'

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
  pnpm tsx migrate-cli.ts --wallet "https://ilp.interledger-test.dev/darianusd"

  # Migrate all wallets from the legacy prefix
  pnpm tsx migrate-cli.ts --batch

  # Dry run a single wallet
  pnpm tsx migrate-cli.ts --wallet "https://ilp.interledger-test.dev/darianusd" --dry-run

  # Dry run all wallets (--dry-run without --wallet implies batch)
  pnpm tsx migrate-cli.ts --dry-run
`)
}

function validateEnv() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
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
    region: process.env.AWS_S3_REGION,
    endpoint: process.env.AWS_S3_ENDPOINT,
  })
}

export async function dryRun(
  s3: S3MigrationClient,
  walletAddress: string,
): Promise<void> {
  console.log(`\n [DRY RUN] Previewing migration for: ${walletAddress}`)

  try {
    const alreadyMigrated = await s3.existsInNewPrefix(walletAddress)

    if (alreadyMigrated) {
      console.log('! Already migrated - would only delete legacy key')
      return
    }

    const legacyData = await s3.getJson<ConfigVersions>(walletAddress)
    if (!legacyData) {
      console.log('! No legacy data found - nothing to migrate')
      return
    }
    const newData = convertToConfiguration(legacyData, walletAddress)
    console.log('\n! Conversion successful !')
    console.log('New profile versions:', Object.keys(newData).join(', '))
  } catch (error) {
    console.error('-> Dry run failed:', (error as Error).message)
    throw error
  }
}

export async function migrateSingle(
  s3: S3MigrationClient,
  walletAddress: string,
): Promise<boolean> {
  console.log(`\nMigrating: ${walletAddress}`)

  try {
    if (await s3.existsInNewPrefix(walletAddress)) {
      await s3.deleteFromLegacy(walletAddress)
      console.log('✓ Already in new prefix, deleted legacy key')
      return true
    }

    const legacyData = await s3.getJson<ConfigVersions>(walletAddress)
    if (!legacyData) {
      console.log('! No legacy data found - skipping')
      return false
    }
    const newData = convertToConfiguration(legacyData, walletAddress)
    await s3.putJson(walletAddress, newData)
    await s3.deleteFromLegacy(walletAddress)
    console.log('✓ Successfully migrated')
    return true
  } catch (error) {
    console.error('x Migration failed:', (error as Error).message)
    throw error
  }
}

async function migrateBatch(
  s3: S3MigrationClient,
  wallets: string[],
): Promise<void> {
  console.log(`\nStarting batch migration for ${wallets.length} wallets...`)

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as { wallet: string; error: string }[],
  }

  for (const wallet of wallets) {
    try {
      const migrated = await migrateSingle(s3, wallet)
      if (migrated) {
        results.successful++
      } else {
        results.skipped++
      }
    } catch (error) {
      results.failed++
      results.errors.push({
        wallet,
        error: (error as Error).message,
      })
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Migration Summary')
  console.log('='.repeat(50))
  console.log(`Total wallets: ${wallets.length}`)
  console.log(`✓ Successful: ${results.successful}`)
  console.log(`! Skipped: ${results.skipped}`)
  console.log(`x Failed: ${results.failed}`)

  if (results.errors.length > 0) {
    console.log('\nErrors:')
    results.errors.forEach(({ wallet, error }) => {
      console.log(`  ${wallet}: ${error}`)
    })
  }

  if (results.failed > 0) {
    process.exit(1)
  }
}

export async function main() {
  const { wallet, batch, dryRun: isDryRun } = parseArgs()
  const isBatch = batch || (!wallet && isDryRun)

  if (!wallet && !isBatch) {
    console.error('Error: Either --wallet or --batch must be specified')
    printHelp()
    process.exit(1)
  }

  validateEnv()

  console.log('='.repeat(50))
  console.log(`Dry Run: ${isDryRun ? 'Yes' : 'No'}`)
  console.log('='.repeat(50))

  const s3 = setupClient()

  try {
    if (wallet && isDryRun) {
      await dryRun(s3, wallet)
      console.log('\n [DRY RUN] No data was uploaded or deleted')
      return
    }

    if (wallet) {
      await migrateSingle(s3, wallet)
      console.log('\n ✓ Migration complete')
      return
    }

    const wallets = await s3.listLegacyWallets()
    if (wallets.length === 0) {
      console.log('x No wallets found in legacy prefix')
      return
    }

    if (isDryRun) {
      for (const w of wallets) await dryRun(s3, w)
      console.log('\n [DRY RUN] No data was uploaded or deleted')
    } else {
      await migrateBatch(s3, wallets)
      console.log('\n ✓ Batch migration complete')
    }
  } catch (error) {
    console.error('\n x Migration failed:', error)
    process.exit(1)
  }
}

// only run main CLI if this file executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main as default }
