import type { WalletAddress } from '@interledger/open-payments'
import type { ElementConfigType } from '~/lib/types.js'
import { CornerType, PositionType, SlideAnimationType } from '~/lib/types.js'
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

export function getDefaultData(): ElementConfigType {
  return {
    walletAddress: undefined,
    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: CornerType.Light,
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#ff808c',
    bannerFontName: 'Arial',
    bannerFontSize: 16,
    bannerTitleText: 'How to support?',
    bannerDescriptionText:
      'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.',
    bannerSlideAnimation: SlideAnimationType.Down,
    bannerPosition: PositionType.Bottom,
    bannerTextColor: '#ffffff',
    bannerBackgroundColor: '#7f76b2',
    bannerBorder: CornerType.Light,
    widgetFontName: 'Arial',
    widgetFontSize: 16,
    widgetDonateAmount: 1,
    widgetTitleText: 'Future of support',
    widgetDescriptionText:
      'Experience the new way to support our content. Activate Web Monetization in your browser and support our work as you browse. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!',
    widgetButtonText: 'Support me',
    widgetButtonBackgroundColor: '#4ec6c0',
    widgetButtonTextColor: '#000000',
    widgetButtonBorder: CornerType.Light,
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetTriggerBackgroundColor: '#ffffff',
    widgetTriggerIcon: '',

    // This CSS string is generated from the configuration values above through these steps:
    // 1. the generateConfigCss() function creates raw CSS rules using all the configuration values
    // 2. the raw CSS string is compressed using gzip via CompressionStream
    // 3. the compressed binary data is converted to a base64 string with encodeAndCompressParameters()
    // 4. the process is equivalent to calling: encodeAndCompressParameters(generateConfigCss(config, true))
    // allows storage and transmission of all tools styling information
    css: 'H4sIAAAAAAAAA61S227bMAz9lW5-WYFQCFIkA2ygQL8koCy64UZJrkR1Ngz_-2BtaRds6NP4JJE6Fx7IsIw4n2108zLEoDCgZ5nbp8QouzxnJQ-FdxlDhkyJh0_sx5gUg3Z9lJjaZqjVread684W1RjMD68wxORRFa0Q_Govt0CL_ffnFEtw8HuAB-uc7WxMjhIkdFxyuzcPX4-JfKcJQ2blGFoU2ZtjJsx0q2_QxxIUHOdRcN79ORPeNTQphcwxwIhztXgnaEmWD3ZqLoROKOfCUCMQSDHqgiJtoldK2q3_IuYwFr0S72t98NA4zltWbvk7F6p1zf10OnVr81KiUsU_On41g9DUBr1Af2FxXx7ul60DjhP1NbI-SvGhW5vzOdCkbyBzgaGI1POmZ1jJZ-gpKCXzrWTlYb5exwmOG_Lz_eby1uQ1uv8iUNFe4bA3SpOCxUyLx_TMATSO7WH7EOtPZC6FXcYCAAA='
  }
}
