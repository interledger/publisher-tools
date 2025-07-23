import { cx } from 'class-variance-authority'
import { useEffect, useMemo, useRef, useState } from 'react'
import { bgColors } from '~/lib/presets.js'
import {
  PositionType,
  SlideAnimationType,
  type ElementConfigType
} from '@shared/types'
import { generateConfigCss, getWebMonetizationLink } from '~/lib/utils.js'
import { NotFoundConfig } from '../index.js'
import eyeSvg from '~/assets/images/eye.svg'
import type { PaymentWidget, WidgetConfig } from '@tools/components'

const ButtonConfig = ({ config }: { config: ElementConfigType }) => {
  return (
    <button className="wm_button" onClick={(e) => console.log(e)}>
      {config.buttonText || '?'}
    </button>
  )
}

const BannerConfig = ({ config }: { config: ElementConfigType }) => {
  const [animated, setAnimated] = useState(
    config.bannerSlideAnimation != SlideAnimationType.None
  )
  const [position, setPosition] = useState(PositionType.Bottom)
  const [triggerAnimation, setTriggerAnimation] = useState(false)
  const [extensionLink, setExtensionLink] = useState('')

  useEffect(() => {
    setAnimated(config.bannerSlideAnimation != SlideAnimationType.None)
    setPosition(config.bannerPosition)
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
  apiUrl,
  opWallet
}: {
  config: ElementConfigType
  apiUrl: string
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
        await import('@tools/components/widget')
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
        apiUrl,
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
      widget.requestPayment = false
      widget.requestQuote = false
    }
  }, [widgetConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return <wm-payment-widget ref={widgetRef} />
}

const RenderElementConfig = ({
  type,
  apiUrl,
  opWallet,
  toolConfig
}: {
  type: string
  apiUrl: string
  opWallet: string
  toolConfig: ElementConfigType
}) => {
  switch (type) {
    case 'button':
      return <ButtonConfig config={toolConfig} />
    case 'banner':
      return <BannerConfig config={toolConfig} />
    case 'widget':
      return <Widget apiUrl={apiUrl} opWallet={opWallet} config={toolConfig} />
    default:
      return <NotFoundConfig />
  }
}

type ToolPreviewProps = {
  type?: string
  apiUrl: string
  opWallet: string
  toolConfig: ElementConfigType
}

export const ToolPreview = ({
  type,
  apiUrl,
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
        apiUrl={apiUrl}
        opWallet={opWallet}
      />
    </div>
  )
}
