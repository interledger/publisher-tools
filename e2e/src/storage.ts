import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import { S3_URL } from './services'

// Same storage the frontend saves to in dev. The local S3 doesn't check credentials.
const storage = new ConfigStorageService({
  AWS_ACCESS_KEY_ID: 'e2e',
  AWS_SECRET_ACCESS_KEY: 'e2e',
  AWS_S3_ENDPOINT: S3_URL,
  AWS_PREFIX,
})

/** Removes the config saved for a wallet address, with all its tool profiles */
export function deleteConfig(walletAddressId: string) {
  return storage.delete(walletAddressId)
}
