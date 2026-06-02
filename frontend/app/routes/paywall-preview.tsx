import { useEffect, useState } from 'react'
import { NO_OP_CONTROLLER } from '@c/paywall/controller'
import { getDefaultProfile } from '@shared/default-data'
import { CDN_URL } from '@shared/defines'
import { sleep } from '@shared/utils'
import type { Message } from '~/components/paywall/PaywallPreview'

export default function PaywallPreview() {
  const [profile, setProfile] = useState(() => getDefaultProfile('paywall'))
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    document.querySelector('body > header')?.remove()
    document.querySelector('body > footer')?.remove()
  }, [])

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
    })

    const container = document.getElementById('paywall-preview-container')!
    container.appendChild(el)
    window.parent.postMessage('ready', window.location.origin)

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const profile = ev.data.profile
        setProfile(profile)
        document.querySelector(NAME)?.updateUI(profile)
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

function PlaceholderContent() {
  const text = `Below 2,000 metres, almost nothing moves quickly.
    What looks empty on a sonar readout is a careful exchange between
    organisms that trade carbon, nitrogen, and light.
    For a long time we only measured it by what washed up.`

  return (
    <div className="p-4 space-y-2 select-none" role="presentation">
      <div className="text-style-h5">The quiet economy of the deep ocean</div>
      <div className="w-full h-[20vh] bg-gray-200"></div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
    </div>
  )
}
