import type { MonetizationEvent, OfferwallProfile } from '@shared/types'
import type { getScriptParams } from '..'

export declare enum InitializeResponseEnum {
  CUSTOM_CHOICE_DISABLED,
  ACCESS_GRANTED,
  ACCESS_NOT_GRANTED,
}

export interface InitializeParams {
  offerwallLanguageCode?: string
}

export interface OfferwallCustomChoice {
  initialize(initParams: InitializeParams): Promise<InitializeResponseEnum>
  show(): Promise<boolean>
}

export interface GoogleOfcExtendedWindow extends Window {
  googlefc: {
    offerwall: {
      customchoice: {
        InitializeResponseEnum: typeof InitializeResponseEnum
        registry: OfferwallCustomChoice
      }
    }
  }
  googletag?: {
    cmd?: (() => void)[]
    enableServices?: () => void
  }
}

export interface OfferwallChoiceConstructorParams {
  elementName: string
  linkElem: HTMLLinkElement
  params: ReturnType<typeof getScriptParams>
  storage: {
    get(key: string): string | null
    set(key: string, value: string): void
    delete(key: string): void
  }
  fetchConfig(
    params: ReturnType<typeof getScriptParams>,
  ): Promise<OfferwallProfile>
}

export type StoredEvent =
  | { type: 'install'; timestamp: number }
  | {
      type: 'monetization'
      timestamp: number
      event: {
        target: { href: HTMLLinkElement['href'] } // wallet address
        paymentPointer: MonetizationEvent['paymentPointer']
        incomingPayment: MonetizationEvent['incomingPayment']
      }
    }
