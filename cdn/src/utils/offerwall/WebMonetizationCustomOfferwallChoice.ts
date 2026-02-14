import type { OfferwallModal } from '@c/offerwall'
import type { Controller } from '@c/offerwall/controller'
import { applyFontFamily } from '@c/utils'
import type { MonetizationEvent, OfferwallProfile } from '@shared/types'
import { isValidDate, isValidUrl, withResolvers } from '@shared/utils'
import {
  getBrowserSupportForExtension,
  isExtensionInstalled,
} from '@shared/utils/extension'
import type {
  GoogleOfcExtendedWindow,
  InitializeParams,
  InitializeResponseEnum,
  OfferwallChoiceConstructorParams,
  OfferwallCustomChoice,
  StoredEvent,
} from './types'

export class WebMonetizationCustomOfferwallChoice implements OfferwallCustomChoice {
  #browserSupportKey = getBrowserSupportForExtension(
    navigator.userAgent,
    navigator.vendor,
  )

  #deps: OfferwallChoiceConstructorParams

  // @ts-expect-error defined in initialize()
  #configPromise: Promise<OfferwallProfile>
  // @ts-expect-error defined in initialize()
  #monetizationEventResolver: ReturnType<
    typeof withResolvers<MonetizationEvent>
  >

  constructor(deps: OfferwallChoiceConstructorParams) {
    this.#deps = deps
  }

  /**
   * Initialize the custom choice, which may include loading or preparing any
   * resources required to function.
   *
   * This function must resolve within 1s.
   */
  async initialize(
    _initParams: InitializeParams,
  ): Promise<InitializeResponseEnum> {
    const { fetchConfig, linkElem, params } = this.#deps

    this.#configPromise = fetchConfig(params)
    this.#monetizationEventResolver ??= withResolvers<MonetizationEvent>()
    this.#waitForMonetizationEvent(
      linkElem,
      this.#monetizationEventResolver.resolve,
    )

    const win = window as unknown as GoogleOfcExtendedWindow

    if (!this.#browserSupportKey) {
      // Extension not supported by this browser, so let user see other choices.
      return win.googlefc.offerwall.customchoice.InitializeResponseEnum
        .CUSTOM_CHOICE_DISABLED
    }

    if (await this.#isAllowedAccessOnStart()) {
      return win.googlefc.offerwall.customchoice.InitializeResponseEnum
        .ACCESS_GRANTED
    }

    return win.googlefc.offerwall.customchoice.InitializeResponseEnum
      .ACCESS_NOT_GRANTED
  }

  /**
   * Show the custom choice UI on the web page, which may be a subscription
   * service, micro-payments service, rewarded ad, etc. Using this UI, user will
   * finish some task which will give them access to content.
   *
   * When it returns true, the user can access the content (equivalent to
   * {@linkcode InitializeResponseEnum.ACCESS_GRANTED}).
   *
   * If it returns false, user didn't fullfil the Offerwall requirements for
   * this custom choice (like didn't pay) (equivalent to
   * {@linkcode InitializeResponseEnum.ACCESS_NOT_GRANTED})
   */
  async show(): Promise<boolean> {
    const { elementName, params, fetchConfig } = this.#deps

    const abortController = new AbortController()
    const onDoneResolver = withResolvers<boolean>()
    const controller: Controller = {
      onExtensionLinkClick() {
        // can start tracking
      },
      onModalClose() {
        abortController.abort('modal closed by user')
        onDoneResolver.resolve(false)
      },
      onDone() {
        onDoneResolver.resolve(true)
      },
    }

    const owElem = document.createElement(elementName) as OfferwallModal
    owElem.setController(controller)

    // in case initialize() wasn't called
    this.#configPromise ??= fetchConfig(params)
    const profile = await this.#configPromise
    this.#setCssVars(owElem, profile)

    document.body.appendChild(owElem)

    try {
      await this.#runBusinessLogic(owElem, abortController.signal)
      onDoneResolver.resolve(true)
    } catch (error) {
      console.error(error)
      onDoneResolver.resolve(false)
    }

    return onDoneResolver.promise
  }

  // TODO: strengthen security and prevent users to bypass this easily
  async #isAllowedAccessOnStart(): Promise<boolean> {
    if (!isExtensionInstalled()) return false

    const lastEvent = this.#getLastEvent()
    if (!lastEvent) return false

    if (lastEvent.type === 'install') {
      return this.#isWithinAllowedTime(lastEvent.timestamp)
    }
    if (lastEvent.type === 'monetization') {
      if (
        this.#isWithinAllowedTime(lastEvent.timestamp) &&
        this.#isForSameWalletAddress(lastEvent.event.paymentPointer)
      ) {
        return isValidPayment(lastEvent.event.incomingPayment)
      }
    }
    return false
  }

  /**
   * - If extension wasn't installed at start, give access on installation.
   * - If extension was already installed, wait for a valid monetization event
   *   to give access.
   * - If either of above was within allowed time, give access.
   */
  #runBusinessLogic = async (elem: OfferwallModal, signal: AbortSignal) => {
    const { linkElem } = this.#deps
    const wasExtensionInstalledAtStart = isExtensionInstalled()

    const lastEvent = this.#getLastEvent()
    if (
      lastEvent &&
      this.#isWithinAllowedTime(lastEvent.timestamp) &&
      isExtensionInstalled()
    ) {
      return elem.setScreen('all-set')
    }

    if (wasExtensionInstalledAtStart) {
      elem.setScreen('contribution-required')
      while (true) {
        if (!this.#monetizationEventResolver) {
          // if not initialized
          this.#monetizationEventResolver = withResolvers<MonetizationEvent>()
          this.#waitForMonetizationEvent(
            linkElem,
            this.#monetizationEventResolver.resolve,
            signal,
          )
        }

        // TODO: add a timeout? limit how many monetization events can be invalid?
        const event = await this.#monetizationEventResolver.promise
        if (
          this.#isForSameWalletAddress(event.paymentPointer) &&
          (await isValidPayment(event.incomingPayment))
        ) {
          elem.setScreen('all-set')
          this.#setLastEvent({
            type: 'monetization',
            timestamp: Date.now(),
            event: {
              target: { href: linkElem.href },
              paymentPointer: event.paymentPointer,
              incomingPayment: event.incomingPayment,
            },
          })
          return
        } else {
          this.#monetizationEventResolver = withResolvers<MonetizationEvent>()
          this.#waitForMonetizationEvent(
            linkElem,
            this.#monetizationEventResolver.resolve,
            signal,
          )
        }
      }
    } else {
      await this.#waitForExtensionInstall(signal)
      elem.setScreen('all-set')
      this.#setLastEvent({ type: 'install', timestamp: Date.now() })
    }
  }

  #isForSameWalletAddress(url: string): boolean {
    const { walletAddress, walletAddressId } = this.#deps.params
    return url === walletAddress || url === walletAddressId
  }

  // Get the last stored event and validate its structure
  #getLastEvent(): StoredEvent | null {
    const lastEventInfo = this.#deps.storage.get('lastEvent')
    if (!lastEventInfo) return null

    let data: Record<string, unknown>
    try {
      data = JSON.parse(lastEventInfo)
    } catch {
      return null
    }

    if (typeof data !== 'object' || data === null) return null
    if (!data.type || typeof data.type !== 'string') return null
    if (!data.timestamp || typeof data.timestamp !== 'number') return null
    if (!isValidDate(new Date(data.timestamp))) return null

    const { type, timestamp } = data

    if (type === 'install') {
      return { type, timestamp }
    }
    if (type === 'monetization') {
      if (!data.event || typeof data.event !== 'object' || !data.event) {
        return null
      }
      const ev = data.event
      if (!('target' in ev) || !ev.target || typeof ev.target !== 'object') {
        return null
      }
      if (!('paymentPointer' in ev) || !('incomingPayment' in ev)) return null
      if (!('href' in ev.target)) return null
      if (!isValidUrl(ev.target.href)) return null
      if (!isValidUrl(ev.paymentPointer)) return null
      if (!isValidUrl(ev.incomingPayment)) return null
      return {
        type,
        timestamp,
        event: {
          target: { href: ev.target.href },
          paymentPointer: ev.paymentPointer,
          incomingPayment: ev.incomingPayment,
        },
      }
    }

    return null
  }

  #setLastEvent(event: StoredEvent) {
    this.#deps.storage.set('lastEvent', JSON.stringify(event))
  }

  #setCssVars(elem: OfferwallModal, profile: OfferwallProfile) {
    const fontBaseUrl = new URL('/assets/fonts/', this.#deps.params.cdnUrl).href
    const fontFamily = profile.font.name
    applyFontFamily(elem, fontFamily, 'offerwall', fontBaseUrl)

    const borderRadius = profile.border.type
    elem.style.setProperty(
      '--wm-border-radius',
      borderRadiusToNumber(borderRadius),
    )

    const { background, text, theme, headline } = profile.color
    elem.style.setProperty('--wm-text-color', text)
    elem.style.setProperty('--wm-heading-color', headline)
    elem.style.setProperty(
      '--wm-background',
      typeof background === 'string' ? background : '', // TODO: handle gradient,
    )
    elem.style.setProperty(
      '--wm-accent-color',
      typeof theme === 'string' ? theme : '', // TODO: handle gradient,
    )
  }

  #waitForExtensionInstall(signal: AbortSignal) {
    const interval = 1000
    const timeout = 3 * 60 * 1000

    return new Promise<void>((resolve, reject) => {
      let elapsed = 0
      const intervalId = setInterval(() => {
        if (isExtensionInstalled()) {
          clearInterval(intervalId)
          resolve()
        } else {
          elapsed += interval
          if (timeout > 0 && elapsed >= timeout) {
            clearInterval(intervalId)
            reject(new Error('timeout'))
          }
        }
      }, interval)
      signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        reject(new Error('aborted'))
      })
    })
  }

  #waitForMonetizationEvent(
    linkElem: HTMLLinkElement,
    onSuccess: (ev: MonetizationEvent) => void,
    signal?: AbortSignal,
  ) {
    const listener = (event: Event) => {
      // @ts-expect-error should be defined globally
      if (event instanceof globalThis.MonetizationEvent) {
        onSuccess(event as MonetizationEvent)
        linkElem.removeEventListener('monetization', listener)
      }
    }
    linkElem.addEventListener('monetization', listener, { signal })
  }

  #isWithinAllowedTime(ts: number, allowedTime = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - ts < allowedTime
  }
}

// #region Utils
function borderRadiusToNumber(border: OfferwallProfile['border']['type']) {
  switch (border) {
    case 'None':
      return '0'
    case 'Pill':
      return '2rem'
    case 'Light':
    default:
      return '1.5rem'
  }
}

async function isValidPayment(incomingPaymentUrl: string): Promise<boolean> {
  if (!isValidUrl(incomingPaymentUrl)) return false
  // TODO: fetch to check validity
  return true
}
// #endregion
