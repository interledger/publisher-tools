import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { S3MigrationClient } from '@migration/s3'
import type { ConfigVersions } from '@shared/types'
import { convertToConfiguration } from '@shared/utils'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOG_FILE = join(__dirname, 'logs', 'migration-progress.json')

interface LogData {
  startedAt: string
  processed: string[]
}

export class MigrationLog {
  private processed: Set<string>
  private startedAt: string

  constructor(private dryRun: boolean) {
    const data = this.load()
    this.processed = new Set(data.processed)
    this.startedAt = data.startedAt
  }

  private load(): LogData {
    if (existsSync(LOG_FILE)) {
      try {
        const raw = readFileSync(LOG_FILE, 'utf-8')
        const data = JSON.parse(raw) as LogData
        console.log(
          `→ Loaded log: ${data.processed.length} wallets already processed (since ${data.startedAt})`,
        )
        return data
      } catch {
        console.warn('! Could not read log file, starting fresh')
      }
    }
    return { startedAt: new Date().toISOString(), processed: [] }
  }

  has(wallet: string): boolean {
    return this.processed.has(wallet)
  }

  record(wallet: string): void {
    if (this.dryRun) {
      console.log(`[DRY RUN] would log: ${wallet}`)
      return
    }
    this.processed.add(wallet)
    this.flush()
  }

  private flush(): void {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
    writeFileSync(
      LOG_FILE,
      JSON.stringify(
        { startedAt: this.startedAt, processed: [...this.processed] },
        null,
        2,
      ),
      'utf-8',
    )
  }

  get size(): number {
    return this.processed.size
  }
}

export interface MigrationClient {
  getJson<T>(walletAddress: string): Promise<T | null>
  putJson<T>(walletAddress: string, data: T): Promise<void>
  listLegacyWallets(): Promise<string[]>
  existsInNewPrefix(walletAddress: string): Promise<boolean>
  deleteFromLegacy(walletAddress: string): Promise<void>
}

export function makeDryRunClient(client: MigrationClient): MigrationClient {
  return {
    getJson: (w) => client.getJson(w),
    existsInNewPrefix: (w) => client.existsInNewPrefix(w),
    listLegacyWallets: () => client.listLegacyWallets(),
    putJson: (w) => {
      console.log(`[DRY RUN] would putJson: ${w}`)
      return Promise.resolve()
    },
    deleteFromLegacy: (w) => {
      console.log(`[DRY RUN] would deleteFromLegacy: ${w}`)
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

export async function migrateSingle(
  s3: MigrationClient,
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

    return true
  } catch (error) {
    console.error('x Migration failed:', (error as Error).message)
    throw error
  }
}

async function migrateBatch(
  s3: MigrationClient,
  wallets: string[],
  log: MigrationLog,
): Promise<void> {
  const toProcess = wallets.filter((w) => !log.has(w))
  const alreadyDone = wallets.length - toProcess.length

  console.log(`\nStarting batch migration for ${wallets.length} wallets...`)
  if (alreadyDone > 0) {
    console.log(
      `→ Skipping ${alreadyDone} already-processed wallets (from log)`,
    )
  }

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as { wallet: string; error: string }[],
  }

  for (const wallet of toProcess) {
    try {
      const migrated = await migrateSingle(s3, wallet)
      if (migrated) {
        log.record(wallet)
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
    console.error('Note: Either --wallet or --batch must be specified')
    printHelp()
    process.exit(1)
  }

  validateEnv()

  console.log('='.repeat(50))
  console.log(`[DRY RUN]: ${isDryRun ? 'Yes' : 'No'}`)
  console.log('='.repeat(50))

  const client = setupClient()
  const s3: MigrationClient = isDryRun ? makeDryRunClient(client) : client

  try {
    if (wallet) {
      await migrateSingle(s3, wallet)
      console.log('\n ✓ Migration complete')
      return
    }

    const wallets = await client.listLegacyWallets()
    if (wallets.length === 0) {
      console.log('x No wallets found in legacy prefix')
      return
    }

    const log = new MigrationLog(isDryRun)
    await migrateBatch(s3, wallets, log)
    console.log('\n ✓ Batch migration complete')
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
