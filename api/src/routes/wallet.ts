import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import {
  getWalletAddress,
  normalizeWalletAddress,
  WalletAddressFormatError
} from '@shared/utils'
import { app } from '../app.js'
import { createHTTPException } from '../utils/utils.js'

const walletAddressSchema = z.object({
  walletAddress: z.url('Wallet address must be a valid URL')
})

app.get(
  '/wallet',
  zValidator('query', walletAddressSchema),
  async ({ req, json }) => {
    const { walletAddress } = req.valid('query')

    try {
      const walletAddressInfo = await getWalletAddress(walletAddress)

      return json({
        ...walletAddressInfo,
        id: normalizeWalletAddress(walletAddressInfo)
      })
    } catch (error) {
      if (error instanceof WalletAddressFormatError) {
        throw createHTTPException(400, error.message, error)
      }
      throw createHTTPException(500, 'Failed to fetch wallet address', error)
    }
  }
)
