import {
  WalletAddressFormatError,
  type WalletAddressErrorCode,
} from '@shared/utils'

type TranslateWalletError = (key: `errors.${WalletAddressErrorCode}`) => string

/**
 * Shared wallet code can not use the translation hook, so its errors carry a
 * code instead. This turns that code into the translated message. Anything
 * else (for example a network failure) gets the fallback, so raw browser
 * messages are not shown to the user. Callers that used to show the raw
 * message can pass it as the fallback.
 */
export function walletErrorMessage(
  error: unknown,
  t: TranslateWalletError,
  fallback: string,
): string {
  if (error instanceof WalletAddressFormatError && error.code) {
    return t(`errors.${error.code}`)
  }
  return fallback
}
