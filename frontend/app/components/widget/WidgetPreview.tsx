import React, { useEffect, useState, useRef, useMemo } from 'react'
import { NO_OP_CONTROLLER } from '@c/widget/controller'
import { sleep } from '@shared/utils'
import type { PaymentWidget as WidgetComponent } from '@tools/components'
import { useWidgetProfile } from '~/stores/widget-store'

interface Props {
  serviceUrls: { cdn: string; api: string }
  opWallet: string
}

export const WidgetPreview = ({
  serviceUrls,
  opWallet,
}: React.PropsWithChildren<Props>) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile] = useWidgetProfile()
  const widgetRef = useRef<WidgetComponent>(null)

  useEffect(() => {
    const loadWidgetElement = async () => {
      if (!customElements.get('wm-payment-widget')) {
        // dynamic import - ensure component only runs on the client side and not on SSR
        const { PaymentWidget } = await import('@tools/components/widget/index')
        if (!customElements.get('wm-payment-widget')) {
          customElements.define('wm-payment-widget', PaymentWidget)
        }
      }
      setIsLoaded(true)
    }

    loadWidgetElement()
  }, [])

  const widgetConfig = useMemo(() => {
    return {
      apiUrl: serviceUrls.api,
      cdnUrl: serviceUrls.cdn,
      receiverAddress: opWallet,
      profile,
    }
  }, [profile, serviceUrls, opWallet])

  useEffect(() => {
    if (!isLoaded) return
    widgetRef.current?.setController({
      isPreviewMode: true,
      getWallet: NO_OP_CONTROLLER.getWallet,
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
  }, [widgetRef.current, isLoaded])

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      const widget = widgetRef.current
      widget.config = widgetConfig
      widget.isOpen = true
    }
  }, [widgetConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading widget...</div>
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '678px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <wm-payment-widget ref={widgetRef} />
    </div>
  )
}
