import { pathToFileURL } from 'node:url'
import { convertToConfiguration } from '@shared/utils'
import { ConfigMigrationService } from './index'

interface CliOptions {
  wallet?: string
  batch: boolean
  dryRun: boolean
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    batch: false,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
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
        console.error(`Unknown option: ${arg}`)
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
  --wallet, -w <address>        Migrate a single wallet address
  --batch, -b                   Migrate all wallets found in the legacy S3 prefix
  --dry-run, -d                 Preview migration without uploading data
  --help, -h                    Show this help message

Examples:
  # Migrate a single wallet
  pnpm tsx migrate-cli.ts --wallet "https://ilp.interledger-test.dev/darianusd"

  # Migrate all wallets from the legacy prefix
  pnpm tsx migrate-cli.ts --batch

  # Dry run to preview all wallets
  pnpm tsx migrate-cli.ts --dry-run --batch
`)
}

function validateEnv() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_ENDPOINT',
  ]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('Error: Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\n Please set these environment variables and try again.')
    process.exit(1)
  }
}

function setupService(): ConfigMigrationService {
  const secrets = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT!,
  }

  return new ConfigMigrationService(secrets)
}

async function dryRun(
  service: ConfigMigrationService,
  walletAddress: string,
): Promise<void> {
  console.log(`\n [DRY RUN] Previewing migration for: ${walletAddress}`)

  try {
    const alreadyMigrated = await service.existsInNewPrefix(walletAddress)

    if (alreadyMigrated) {
      console.log('! Already migrated - would only delete legacy key')
      return
    }

    const legacyData = await service.getJson(walletAddress)
    console.log('\n! Legacy data found')
    console.log('Legacy profile versions:', Object.keys(legacyData).join(', '))

    const newData = convertToConfiguration(legacyData, walletAddress)
    console.log('\n! Conversion successful !')
    console.log('New profile versions:', Object.keys(newData).join(', '))
  } catch (error) {
    if ((error as Error).name === 'NoSuchKey') {
      console.log('-> No legacy data found - nothing to migrate')
    } else {
      console.error('-> Dry run failed:', (error as Error).message)
      throw error
    }
  }
}

async function migrateSingle(
  service: ConfigMigrationService,
  walletAddress: string,
): Promise<boolean> {
  console.log(`\nMigrating: ${walletAddress}`)

  try {
    await service.migrate(walletAddress, convertToConfiguration)
    console.log('✓ Successfully migrated')
    return true
  } catch (error) {
    if ((error as Error).name === 'NoSuchKey') {
      console.log('! No legacy data found - skipping')
      return false
    }
    console.error('x Migration failed:', (error as Error).message)
    throw error
  }
}

async function migrateBatch(
  service: ConfigMigrationService,
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
      const migrated = await migrateSingle(service, wallet)
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

async function main() {
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

  const service = setupService()

  try {
    if (wallet) {
      if (isDryRun) {
        await dryRun(service, wallet)
        console.log('\n [DRY RUN] No data was uploaded or deleted')
      } else {
        await migrateSingle(service, wallet)
        console.log('\n ✓ Migration complete')
      }
    } else {
      const wallets = await service.listLegacyWallets()

      if (wallets.length === 0) {
        console.log('x No wallets found in legacy prefix')
      } else if (isDryRun) {
        for (const w of wallets) await dryRun(service, w)
        console.log('\n[DRY RUN] No data was uploaded or deleted')
      } else {
        await migrateBatch(service, wallets)
        console.log('\n ✓ Batch migration complete')
      }
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

export { main, parseArgs, setupService }
