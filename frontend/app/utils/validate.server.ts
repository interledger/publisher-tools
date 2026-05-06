import z from 'zod'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError,
} from '@shared/utils'

// TODO: refactor walletSchema to .transform() and return WalletAddress object directly from getWalletAddress
export const walletSchema = z.object({
  walletAddress: z
    .string()
    .min(1, { message: 'Wallet address is required' })
    .transform((url) => toWalletAddressUrl(url))
    .superRefine(async (updatedUrl, ctx) => {
      if (updatedUrl.length === 0) return

      try {
        checkHrefFormat(updatedUrl)
        await getWalletAddress(updatedUrl)
      } catch (e) {
        ctx.addIssue({
          code: 'custom',
          message:
            e instanceof WalletAddressFormatError
              ? e.message
              : 'Invalid wallet address format',
        })
      }
    }),
})
