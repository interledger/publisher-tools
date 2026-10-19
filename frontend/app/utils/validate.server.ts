import z from 'zod'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError,
} from '@shared/utils'
import type { TranslateWalletError } from '~/lib/walletError'

// TODO: refactor walletSchema to .transform() and return WalletAddress object directly from getWalletAddress
export function createWalletSchema(t: TranslateWalletError) {
  return z.object({
    walletAddress: z
      .string()
      .min(1, { message: t('errors.required') })
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
              e instanceof WalletAddressFormatError && e.code
                ? t(`errors.${e.code}`, e.params)
                : t('errors.invalidWalletFormat'),
          })
        }
      }),
  })
}
