import React, { useEffect, useState, useRef, useMemo } from 'react'
import type {
  WidgetConfig,
  PaymentWidget as WidgetComponent
} from '@tools/components'
import type { WidgetConfig as WidgetStoredConfig } from '@shared/types'

interface Props {
  profile: WidgetStoredConfig
  serviceUrls: { cdn: string; api: string }
  opWallet: string
}

export const WidgetPreview = ({
  profile,
  serviceUrls,
  opWallet
}: React.PropsWithChildren<Props>) => {
  const [isLoaded, setIsLoaded] = useState(false)
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
      action: profile.widgetButtonText,
      widgetTitleText: profile.widgetTitleText,
      widgetDescriptionText: profile.widgetDescriptionText,
      isWidgetDescriptionVisible: profile.widgetDescriptionVisible,
      widgetTriggerIcon: profile.widgetTriggerIcon,
      widgetPosition: profile.widgetPosition,
      theme: {
        primaryColor: profile.widgetButtonBackgroundColor,
        backgroundColor: profile.widgetBackgroundColor,
        textColor: profile.widgetTextColor,
        fontSize: profile.widgetFontSize,
        fontFamily: profile.widgetFontName,
        widgetBorderRadius: profile.widgetButtonBorder,
        widgetButtonBackgroundColor: profile.widgetTriggerBackgroundColor
      }
    } as WidgetConfig
  }, [profile, serviceUrls, opWallet])

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      const widget = widgetRef.current
      widget.config = widgetConfig
      widget.isPreview = true
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      <wm-payment-widget ref={widgetRef} />
    </div>
  )
}
