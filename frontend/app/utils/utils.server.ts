import type { WalletAddress } from '@interledger/open-payments'
import type { ElementConfigType } from '@shared/types'
import { CornerType, PositionType, SlideAnimationType } from '@shared/types'
import { toWalletAddressUrl } from '@shared/utils'

export function normalizeWalletAddress(walletAddress: WalletAddress): string {
  const IS_INTERLEDGER_CARDS =
    walletAddress.authServer === 'https://auth.interledger.cards'
  const url = new URL(toWalletAddressUrl(walletAddress.id))
  if (IS_INTERLEDGER_CARDS && url.host === 'ilp.dev') {
    // For Interledger Cards we can have two types of wallet addresses:
    //  - ilp.interledger.cards
    //  - ilp.dev (just a proxy behind ilp.interledger.cards for certain wallet addresses)
    //
    // `ilp.dev` wallet addresses are only used for wallet addresses that are
    // linked to a card.
    //
    // `ilp.interledger.cards` used for the other wallet addresses (user created)
    //
    // Not all `ilp.interledger.cards` wallet addresses can be used with `ilp.dev`.
    // Manually created wallet addresses cannot be used with `ilp.dev`.
    return walletAddress.id.replace('ilp.dev', 'ilp.interledger.cards')
  }
  return walletAddress.id
}

/**
 * @param obj
 * @param levelCount
 * @returns Record<string, any>
 * @description Returns only properties that are at least levelCount deep
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export const filterDeepProperties = (
  obj: Record<string, any>,
  levelCount: number = 2
): Record<string, any> => {
  const result: Record<string, any> = {}

  const traverse = (
    current: any,
    path: string[],
    parent: Record<string, any>
  ) => {
    if (typeof current === 'object' && current !== null) {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const newPath = [...path, key]

          if (typeof current[key] === 'object' && current[key] !== null) {
            // Ensure parent structure exists
            if (path.length === 0) {
              if (!result[key]) result[key] = {}
              traverse(current[key], newPath, result[key])
            } else {
              if (!parent[key]) parent[key] = {}
              traverse(current[key], newPath, parent[key])
            }
          } else if (path.length >= levelCount - 1) {
            // Only keep properties that are at least levelCount levels deep
            if (!result[path[0]]) result[path[0]] = {}
            result[path[0]][key] = current[key]
          }
        }
      }
    }
  }

  traverse(obj, [], result)
  return result
}
