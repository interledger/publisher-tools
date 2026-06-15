import { useEffect, useState } from 'react'
import { NO_OP_CONTROLLER } from '@c/paywall/controller'
import { getDefaultProfile } from '@shared/default-data'
import { CDN_URL } from '@shared/defines'
import { sleep } from '@shared/utils'
import type {
  Message,
  MessageFromIframe,
} from '~/components/paywall/PaywallPreview'

export default function PaywallPreview() {
  const [profile, setProfile] = useState(() => getDefaultProfile('paywall'))
  const [isLoaded, setIsLoaded] = useState(false)

  const NAME = 'wm-paywall'
  useEffect(() => {
    const load = async () => {
      if (!customElements.get(NAME)) {
        const { Paywall } = await import('@tools/components/paywall/index')
        if (!customElements.get(NAME)) {
          customElements.define(NAME, Paywall)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const el = document.createElement(NAME)
    const actions = el.setController({
      isPreviewMode: true,
      fetchConfig: () => Promise.resolve(profile),
      async checkEntitlement(walletAddress) {
        if (walletAddress) {
          await sleep(2000)
          return { entitlement: 'has-access' }
        }
        return { entitlement: 'no-access' }
      },
      cdnUrl: CDN_URL,
      remove: (el) => el.toggleAttribute('hidden'),
      authenticate: NO_OP_CONTROLLER.authenticate,
      getStatus: NO_OP_CONTROLLER.getStatus,
      getWallet: NO_OP_CONTROLLER.getWallet,
      initiatePayment: NO_OP_CONTROLLER.initiatePayment,
      receiverWalletAddressUrl: 'https://example.com',
      senderWalletAddressUrl: '',

      onScreenChange(view) {
        postMessage({ type: 'CURRENT_SCREEN', view })
      },
    })

    const container = document.getElementById('paywall-preview-container')!
    container.appendChild(el)
    postMessage({ type: 'READY' })

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const profile = ev.data.profile
        setProfile(profile)
        el.updateUI(profile)
      } else if (ev.data.action === 'RESET') {
        el.removeAttribute('hidden')
        actions.setView('home')
      }
    }

    el.updateUI(profile)
    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [isLoaded])

  return (
    <div id="paywall-preview-container">
      <PlaceholderContent />
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
      {/* element gets injected here */}
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}

function PlaceholderContent() {
  const text = `Below 2,000 metres, almost nothing moves quickly.
    What looks empty on a sonar readout is a careful exchange between
    organisms that trade carbon, nitrogen, and light.
    For a long time we only measured it by what washed up.`

  return (
    <div
      className="p-4 space-y-2 select-none font-serif text-lg"
      role="presentation"
    >
      <div className="flex justify-between border-b border-gray-200 pb-2">
        <div>
          <div className="font-sans font-semibold">Your Website</div>
        </div>
        <div className="flex gap-4">
          <div className="w-20 p-4 border rounded-2xl"></div>
          <div className="w-20 p-4 border rounded-2xl bg-current"></div>
        </div>
      </div>
      <div className="max-w-screen-md mx-auto space-y-4">
        <div className="text-2xl">The quiet economy of the deep ocean</div>
        <div className="w-full h-24 md:h-[20vh] bg-gray-200"></div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
        <div>{text}</div>
      </div>
    </div>
  )
}
