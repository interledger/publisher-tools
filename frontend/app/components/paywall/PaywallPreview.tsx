import { useEffect, useState } from 'react'
import { subscribe, useSnapshot } from 'valtio'
import { deepClone } from 'valtio/utils'
import { NO_OP_CONTROLLER } from '@c/paywall/controller'
import { paywall, usePaywallProfile } from '~/stores/paywall-store'
import { toolState } from '~/stores/toolStore'

export function PaywallPreview() {
  const [profile] = usePaywallProfile()
  const snap = useSnapshot(toolState)
  const [isLoaded, setIsLoaded] = useState(false)
  const name = 'wm-paywall'

  useEffect(() => {
    const load = async () => {
      if (!customElements.get(name)) {
        const { Paywall } = await import('@tools/components/paywall/index')
        if (!customElements.get(name)) {
          customElements.define(name, Paywall)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoaded || !snap.cdnUrl) return

    const el = document.createElement(name)
    const _actions = el.setController({
      isPreviewMode: true,
      authenticate: NO_OP_CONTROLLER.authenticate,
      cdnUrl: snap.cdnUrl,
      checkEntitlement: NO_OP_CONTROLLER.checkEntitlement,
      fetchConfig: () => Promise.resolve(deepClone(profile)),
      getStatus: NO_OP_CONTROLLER.getStatus,
      getWallet: NO_OP_CONTROLLER.getWallet,
      initiatePayment: NO_OP_CONTROLLER.initiatePayment,
      receiverWalletAddressUrl: snap.opWallet,
      senderWalletAddressUrl: '',
    })
    const container = document.getElementById('paywall-preview-container')!
    container.appendChild(el)

    return subscribe(paywall.profile, () => {
      el.updateUI(deepClone(paywall.profile))
    })
  }, [snap.cdnUrl, isLoaded])

  return (
    <div className="relative w-full h-[744px]" id="paywall-preview-container">
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
    </div>
  )
}
