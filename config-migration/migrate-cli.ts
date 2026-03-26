import { ConfigMigrationService } from './index'
import { convertToConfiguration } from '../frontend/app/utils/profile-converter'

interface CliOptions {
  wallet?: string
  batch?: string[]
  dryRun: boolean
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
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
        options.batch = args[++i].split(',').map((w) => w.trim())
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
Config Migration CLI Tool

Usage:
  migrate-cli.ts [options]

Options:
  --wallet, -w <address>        Migrate a single wallet address
  --batch, -b <addresses>       Migrate multiple wallet addresses (comma-separated)
  --dry-run, -d                 Preview migration without uploading data
  --help, -h                    Show this help message

Examples:
  # Migrate a single wallet
  pnpm tsx migrate-cli.ts --wallet "\\$wallet.example.com"

  # Migrate multiple wallets
  pnpm tsx migrate-cli.ts --batch "\\$wallet1.example.com,\\$wallet2.example.com"

  # Dry run to preview changes
  pnpm tsx migrate-cli.ts --dry-run --wallet "\\$wallet.example.com"
`)
}

function validateEnv() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_ENDPOINT',
    'AWS_PREFIX',
  ]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('Error: Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\nPlease set these environment variables and try again.')
    process.exit(1)
  }
}

function setupService(): ConfigMigrationService {
  const secrets = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT!,
    AWS_PREFIX: process.env.AWS_PREFIX!,
  }

  return new ConfigMigrationService(secrets)
}

async function dryRun(
  service: ConfigMigrationService,
  walletAddress: string,
): Promise<void> {
  console.log(`\n[DRY RUN] Previewing migration for: ${walletAddress}`)

  try {
    const alreadyMigrated = await service.existsInNewPrefix(walletAddress)

    if (alreadyMigrated) {
      console.log('⊘ Already migrated - would only delete legacy key')
      return
    }

    const legacyData = await service.getJson(walletAddress)
    console.log('\n✓ Legacy data found')
    console.log('Legacy profile versions:', Object.keys(legacyData).join(', '))

    const newData = convertToConfiguration(legacyData, walletAddress)
    console.log('\n✓ Conversion successful')
    console.log('New profile versions:', Object.keys(newData).join(', '))
    console.log('\nPreview of converted data:')
    console.log(JSON.stringify(newData, null, 2))

    console.log('\n[DRY RUN] No data was uploaded or deleted')
  } catch (error) {
    if ((error as Error).name === 'NoSuchKey') {
      console.log('⊘ No legacy data found - nothing to migrate')
    } else {
      console.error('✗ Dry run failed:', (error as Error).message)
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
      console.log('⊘ No legacy data found - skipping')
      return false
    }
    console.error('✗ Migration failed:', (error as Error).message)
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
  console.log(`⊘ Skipped: ${results.skipped}`)
  console.log(`✗ Failed: ${results.failed}`)

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
  const options = parseArgs()

  if (!options.wallet && !options.batch) {
    console.error('Error: Either --wallet or --batch must be specified')
    printHelp()
    process.exit(1)
  }

  validateEnv()

  console.log('Config Migration CLI')
  console.log('='.repeat(50))
  console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`)
  console.log('='.repeat(50))

  const service = setupService()

  try {
    if (options.dryRun && options.wallet) {
      await dryRun(service, options.wallet)
    } else if (options.wallet) {
      await migrateSingle(service, options.wallet)
      console.log('\n✓ Migration complete')
    } else if (options.batch) {
      if (options.dryRun) {
        for (const wallet of options.batch) {
          await dryRun(service, wallet)
        }
      } else {
        await migrateBatch(service, options.batch)
        console.log('\n✓ Batch migration complete')
      }
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    process.exit(1)
  }
}

// only run main CLI if this file executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main, parseArgs, setupService }
