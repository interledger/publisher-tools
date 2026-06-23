import { useEffect, useState } from 'react'
import { NO_OP_CONTROLLER } from '@c/widget/controller'
import { getDefaultProfile } from '@shared/default-data'
import { API_URL, CDN_URL } from '@shared/defines'
import type { WidgetProfile } from '@shared/types'
import { sleep } from '@shared/utils'
import { ToolPreviewPlaceholder } from '~/components/ToolPreviewPlaceholder'
import type {
  Message,
  MessageFromIframe,
} from '~/components/widget/WidgetPreview'

export default function WidgetPreviewRoute() {
  const [profile, setProfile] = useState<WidgetProfile>(() =>
    getDefaultProfile('widget'),
  )
  const [isLoaded, setIsLoaded] = useState(false)

  const NAME = 'wm-payment-widget'
  useEffect(() => {
    const load = async () => {
      if (!customElements.get(NAME)) {
        const { PaymentWidget } = await import('@tools/components/widget/index')
        if (!customElements.get(NAME)) {
          customElements.define(NAME, PaymentWidget)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const update = (profile: WidgetProfile) => {
      el.config = {
        apiUrl: API_URL,
        cdnUrl: CDN_URL,
        receiverAddress: 'https://example.com',
        profile,
      }
      el.isOpen = true
    }

    const el = document.createElement(NAME)
    el.setController({
      isPreviewMode: true,
      getWallet: NO_OP_CONTROLLER.getWallet,
      validateCompatibility: NO_OP_CONTROLLER.validateCompatibility,
      async fetchQuote(request) {
        await sleep(500)
        return NO_OP_CONTROLLER.fetchQuote(request)
      },
      async initiatePayment(request) {
        await sleep(500)
        return NO_OP_CONTROLLER.initiatePayment(request)
      },
      async *getStatus() {
        const outgoingPaymentId = 'https://example.com/outgoing-payments/id'
        yield { type: 'PENDING_GRANT_INTERACTION' }
        await sleep(2000)
        yield { type: 'OUTGOING_PAYMENT_CREATED', outgoingPaymentId }
        await sleep(2000)
        yield {
          type: 'OUTGOING_PAYMENT_DONE',
          result: 'success',
          outgoingPaymentId,
        }
      },
    })

    const container = document.getElementById('preview-container')!
    container.appendChild(el)
    postMessage({ type: 'READY' })

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const profile = ev.data.profile
        setProfile(profile)
        update(profile)
      }
    }

    update(profile)
    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [isLoaded])

  return (
    <div id="preview-container">
      <ToolPreviewPlaceholder />
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
      {/* element gets injected here */}
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}
