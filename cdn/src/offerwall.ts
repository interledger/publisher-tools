import { API_URL } from '@shared/defines'
import { OfferwallModal } from '@tools/components'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'
import {
  WebMonetizationCustomOfferwallChoice,
  type OfferwallChoiceConstructorParams,
  type GoogleOfcExtendedWindow,
} from './utils/offerwall'

const NAME = 'wm-offerwall'
customElements.define(NAME, OfferwallModal)

const params = getScriptParams('offerwall')
const linkElem = appendPaymentPointer(params.walletAddress)

const STORAGE_KEY_PREFIX = 'wmt.offerwall.'
const toStorageKey = (key: string) => `${STORAGE_KEY_PREFIX}${key}`
const storage: OfferwallChoiceConstructorParams['storage'] = {
  get: (key) => localStorage.getItem(toStorageKey(key)),
  set: (key, value) => localStorage.setItem(toStorageKey(key), value),
  delete: (key) => localStorage.removeItem(toStorageKey(key)),
}

const offerwallConstructorParams: OfferwallChoiceConstructorParams = {
  elementName: NAME,
  linkElem,
  storage,
  params,
  fetchConfig: (params) => fetchProfile(API_URL, 'offerwall', params),
}

// Register the custom choice with the Offerwall.
const win = window as unknown as GoogleOfcExtendedWindow
// @ts-expect-error defined by external script
win.googlefc ||= {}
// @ts-expect-error defined by external script
win.googlefc.offerwall ||= {}
// @ts-expect-error defined by external script
win.googlefc.offerwall.customchoice ||= {}
win.googlefc.offerwall.customchoice.registry =
  new WebMonetizationCustomOfferwallChoice(offerwallConstructorParams)

win.googletag ||= { cmd: [] }
win.googletag?.cmd?.push(() => {
  win.googletag?.enableServices?.()
})

// Uncomment following to show regardless of initialization status
// win.googlefc.offerwall.customchoice.registry.show()
