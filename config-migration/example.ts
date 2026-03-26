import type { Configuration } from '@shared/types'
import { ConfigMigrationService } from './index'
import { convertToConfiguration } from '../frontend/app/utils/profile-converter'

function setupMigrationService() {
  const env = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT!,
    AWS_PREFIX: process.env.AWS_PREFIX!,
  }

  return new ConfigMigrationService(env)
}

async function fetchLegacyData(walletAddress: string) {
  const service = setupMigrationService()

  try {
    const legacyData = await service.getJson(walletAddress)
    console.log('successfully fetched legacy data:', legacyData)
    return legacyData
  } catch (error) {
    if ((error as Error).name === 'NoSuchKey') {
      console.log('no legacy data found for wallet:', walletAddress)
      return null
    }
    throw error
  }
}

async function uploadNewFormatData(
  walletAddress: string,
  configuration: Configuration,
) {
  const service = setupMigrationService()

  try {
    await service.putJson(walletAddress, configuration)
    console.log('successfully uploaded new configuration')
  } catch (error) {
    console.error('failed to upload configuration:', error)
    throw error
  }
}

async function migrateLegacy(walletAddress: string) {
  const service = setupMigrationService()

  try {
    await service.migrate(walletAddress, convertToConfiguration)
    console.log('successfully migrated configuration for:', walletAddress)
  } catch (error) {
    console.error('migration failed:', error)
    throw error
  }
}

async function migrateWithRetry(walletAddress: string, maxRetries: number = 3) {
  const service = setupMigrationService()
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      await service.migrate(walletAddress, convertToConfiguration)
      console.log(`migration successful on attempt ${attempt + 1}`)
      return
    } catch (error) {
      attempt++
      console.error(`migration attempt ${attempt} failed:`, error)

      if (attempt >= maxRetries) {
        throw new Error(
          `migration failed after ${maxRetries} attempts: ${(error as Error).message}`,
        )
      }

      // wait before retrying (exponential backoff)
      const delayMs = Math.pow(2, attempt) * 500
      console.log(`Retrying in ${delayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

/** batch migrations for multiple wallet addresses */
async function batchMigrate(walletAddresses: string[]) {
  const service = setupMigrationService()
  const results = {
    successful: [] as string[],
    failed: [] as { address: string; error: string }[],
    skipped: [] as string[],
  }

  for (const walletAddress of walletAddresses) {
    try {
      console.log(`migrating ${walletAddress}...`)
      await service.migrate(walletAddress, convertToConfiguration)
      results.successful.push(walletAddress)
      console.log(`✓ ${walletAddress} migrated successfully`)
    } catch (error) {
      if ((error as Error).name === 'NoSuchKey') {
        results.skipped.push(walletAddress)
        console.log(`⊘ ${walletAddress} - no legacy data found`)
      } else {
        results.failed.push({
          address: walletAddress,
          error: (error as Error).message,
        })
        console.error(`✗ ${walletAddress} - migration failed:`, error)
      }
    }
  }

  console.log('\nMigration Summary:')
  console.log(`Successful: ${results.successful.length}`)
  console.log(`Failed: ${results.failed.length}`)
  console.log(`Skipped: ${results.skipped.length}`)

  return results
}

/** check what would be migrated without uploading */
async function dryRunMigration(walletAddress: string) {
  const service = setupMigrationService()

  try {
    const legacyData = await service.getJson(walletAddress)
    console.log('Legacy data:', JSON.stringify(legacyData))

    const newData = convertToConfiguration(legacyData, walletAddress)
    console.log('New data (preview):', JSON.stringify(newData))

    return { legacy: legacyData, new: newData }
  } catch (error) {
    console.error('Dry run failed:', error)
    throw error
  }
}

export {
  setupMigrationService,
  fetchLegacyData,
  uploadNewFormatData,
  migrateLegacy,
  migrateWithRetry,
  batchMigrate,
  dryRunMigration,
}
