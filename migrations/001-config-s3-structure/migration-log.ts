import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

interface LogData {
  startedAt: string
  successful: string[]
  skipped: string[]
  failed: { wallet: string; error: string }[]
}

const LOG_DIR = join(import.meta.dirname, '..', 'logs')

function runTimestamp(): string {
  const iso = new Date().toISOString()
  const date = iso.slice(0, 10).replace(/-/g, '.')
  const time = iso.slice(11, 19).replace(/:/g, '')
  return `${date}.${time}`
}

// example log filename: migration.2026.04.05.143022.json
function logFilename(dryRun: boolean): string {
  const ts = runTimestamp()
  return `migration${dryRun ? '.dry-run' : ''}.${ts}.json`
}

export class MigrationLog {
  private successful: string[] = []
  private skipped: string[] = []
  private failed: { wallet: string; error: string }[] = []
  private startedAt: string = new Date().toISOString()
  private logFile: string

  constructor(dryRun: boolean) {
    this.logFile = join(LOG_DIR, logFilename(dryRun))
  }

  recordSuccess(wallet: string): void {
    this.successful.push(wallet)
  }

  recordSkipped(wallet: string): void {
    this.skipped.push(wallet)
  }

  recordFailure(wallet: string, error: string): void {
    this.failed.push({ wallet, error })
  }

  get hasFailed(): boolean {
    return this.failed.length > 0
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(50))
    console.log('Migration Summary')
    console.log('='.repeat(50))
    console.log(`✓ Successful: ${this.successful.length}`)
    console.log(`! Skipped: ${this.skipped.length}`)
    console.log(`x Failed: ${this.failed.length}`)

    if (this.failed.length > 0) {
      console.log('\nErrors:')
      this.failed.forEach(({ wallet, error }) => {
        console.log(`  ${wallet}: ${error}`)
      })
    }
  }

  save(): void {
    this.printSummary()

    mkdirSync(dirname(this.logFile), { recursive: true })
    const data: LogData = {
      startedAt: this.startedAt,
      successful: this.successful,
      skipped: this.skipped,
      failed: this.failed,
    }
    writeFileSync(this.logFile, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`→ Log saved: ${this.logFile}`)
  }
}
