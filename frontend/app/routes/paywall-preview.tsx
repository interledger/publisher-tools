import { useEffect, useState } from 'react'
import { NO_OP_CONTROLLER } from '@c/paywall/controller'
import { getDefaultProfile } from '@shared/default-data'
import { CDN_URL } from '@shared/defines'
import { sleep } from '@shared/utils'
import type {
  Message,
  MessageFromIframe,
} from '~/components/paywall/PaywallPreview'
import { ToolPreviewPlaceholder } from '~/components/ToolPreviewPlaceholder'

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
      <ToolPreviewPlaceholder />
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
      {/* element gets injected here */}
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}
