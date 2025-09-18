import { cx } from 'class-variance-authority'
import { useEffect, useMemo, useRef, useState } from 'react'
import { bgColors, PositionType } from '~/lib/presets.js'
import { SLIDE_ANIMATION, type ElementConfigType } from '@shared/types'
import { generateConfigCss, getWebMonetizationLink } from '~/lib/utils.js'
import { NotFoundConfig } from '../index.js'
import eyeSvg from '~/assets/images/eye.svg'
import type { PaymentWidget, WidgetConfig } from '@tools/components'

const ButtonConfig = ({
  config
}: {
  config: ElementConfigType
  serviceUrls: Pick<ServiceUrls, 'cdn'>
}) => {
  return (
    <button className="wm_button" onClick={(e) => console.log(e)}>
      {config.buttonText || '?'}
    </button>
  )
}

const BannerConfig = ({
  config
}: {
  config: ElementConfigType
  serviceUrls: Pick<ServiceUrls, 'cdn'>
}) => {
  const [animated, setAnimated] = useState(
    config.bannerSlideAnimation != SLIDE_ANIMATION.None
  )
  const [position, setPosition] = useState(PositionType.Bottom)
  const [triggerAnimation, setTriggerAnimation] = useState(false)
  const [extensionLink, setExtensionLink] = useState('')

  useEffect(() => {
    setAnimated(config.bannerSlideAnimation != SLIDE_ANIMATION.None)
    setPosition(PositionType.Top)
  }, [config])

  useEffect(() => {
    const link = getWebMonetizationLink()
    setExtensionLink(link)
  }, [])

  return (
    <div className="min-h-40">
      {animated && (
        <div className="flex justify-end -mt-5 mb-1">
          <img
            onMouseEnter={() => setTriggerAnimation(true)}
            onMouseLeave={() => setTriggerAnimation(false)}
            className="cursor-progress"
            src={eyeSvg}
            alt="check"
          />
        </div>
      )}
      <div
        className={cx(
          'flex min-h-40',
          position == PositionType.Bottom && 'items-end'
        )}
      >
        <div
          className={cx(
            'wm_banner',
            position == PositionType.Bottom && 'bottom',
            animated && triggerAnimation && 'animate'
          )}
        >
          {config.bannerTitleText && (
            <h5 className="flex flex-row flex-wrap justify-between">
              {config.bannerTitleText}
              <span className="cursor-pointer text-sm">x</span>
            </h5>
          )}
          <span className="w-full my-2">{config.bannerDescriptionText}</span>
          <span
            className="_wm_link underline cursor-pointer"
            dangerouslySetInnerHTML={{ __html: extensionLink }}
          ></span>
        </div>
      </div>
    </div>
  )
}

const Widget = ({
  config,
  serviceUrls,
  opWallet
}: {
  config: ElementConfigType
  serviceUrls: ServiceUrls
  opWallet: string
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const widgetRef = useRef<PaymentWidget>(null)

  useEffect(() => {
    const loadWidgetComponent = async () => {
      try {
        if (customElements.get('wm-payment-widget')) {
          setIsLoaded(true)
          return
        }

        // dynamic import - ensure component only runs on the client side and not on SSR
        const { PaymentWidget } = await import('@tools/components')
        customElements.define('wm-payment-widget', PaymentWidget)
        setIsLoaded(true)
      } catch (error) {
        console.error('Failed to load component:', error)
      }
    }

    loadWidgetComponent()
  }, [])

  const widgetConfig = useMemo(
    () =>
      ({
        apiUrl: serviceUrls.api,
        cdnUrl: serviceUrls.cdn,
        frontendUrl: serviceUrls.app,
        receiverAddress: opWallet,
        action: config.widgetButtonText || 'Pay',
        note: '',
        widgetTitleText: config.widgetTitleText,
        widgetDescriptionText: config.widgetDescriptionText,
        widgetTriggerIcon: config.widgetTriggerIcon,
        theme: {
          primaryColor: config.widgetButtonBackgroundColor,
          backgroundColor: config.widgetBackgroundColor,
          textColor: config.widgetTextColor,
          fontFamily: config.widgetFontName,
          widgetButtonBackgroundColor: config.widgetTriggerBackgroundColor
        }
      }) as WidgetConfig,
    [config]
  )

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      const widget = widgetRef.current
      widget.config = widgetConfig
      widget.isPreview = true
    }
  }, [widgetConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return <wm-payment-widget ref={widgetRef} />
}

type ServiceUrls = { api: string; cdn: string; app: string }

const RenderElementConfig = ({
  type,
  serviceUrls,
  opWallet,
  toolConfig
}: {
  type: string
  serviceUrls: ServiceUrls
  opWallet: string
  toolConfig: ElementConfigType
}) => {
  switch (type) {
    case 'button':
      return <ButtonConfig serviceUrls={serviceUrls} config={toolConfig} />
    case 'banner':
      return <BannerConfig serviceUrls={serviceUrls} config={toolConfig} />
    case 'widget':
      return (
        <Widget
          serviceUrls={serviceUrls}
          opWallet={opWallet}
          config={toolConfig}
        />
      )
    default:
      return <NotFoundConfig />
  }
}

type ToolPreviewProps = {
  type?: string
  serviceUrls: ServiceUrls
  opWallet: string
  toolConfig: ElementConfigType
}

export const ToolPreview = ({
  type,
  serviceUrls,
  opWallet,
  toolConfig
}: ToolPreviewProps) => {
  const bgColor = bgColors[type as keyof typeof bgColors] ?? bgColors.button

  return (
    <div
      className={cx(
        'flex justify-center px-4 py-8 pt-12 rounded-t-lg bg-gradient-to-r',
        bgColor
      )}
    >
      {generateConfigCss(toolConfig)}
      <RenderElementConfig
        type={type ?? ''}
        toolConfig={toolConfig}
        serviceUrls={serviceUrls}
        opWallet={opWallet}
      />
    </div>
  )
}
