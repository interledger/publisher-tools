import z from 'zod'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError,
  type WalletAddressErrorCode,
} from '@shared/utils'
import walletMessages from '~/i18n/locales/en/wallet.json'

export type TranslateWalletError = (
  key: `errors.${WalletAddressErrorCode}`,
  options?: Record<string, string>,
) => string

const translateWalletErrorEn: TranslateWalletError = (key, options) => {
  let message: string = (walletMessages as Record<string, string>)[key] ?? key
  if (options) {
    for (const [name, value] of Object.entries(options)) {
      message = message.replace(`{{${name}}}`, value)
    }
  }
  return message
}

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

export const walletSchema = createWalletSchema(translateWalletErrorEn)
