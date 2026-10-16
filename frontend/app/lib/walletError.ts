import {
  WalletAddressFormatError,
  type WalletAddressErrorCode,
} from '@shared/utils'

type TranslateWalletError = (key: `errors.${WalletAddressErrorCode}`) => string

/**
 * Shared wallet code can not use the translation hook, so its errors carry a
 * code instead. This turns that code into the translated message and falls
 * back to the error's own message when there is no code.
 */
export function walletErrorMessage(
  error: unknown,
  t: TranslateWalletError,
  fallback: string,
): string {
  if (error instanceof WalletAddressFormatError && error.code) {
    return t(`errors.${error.code}`)
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
