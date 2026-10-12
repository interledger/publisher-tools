import { useEffect, useRef, useState } from 'react'
import {
  NO_OP_CONTROLLER,
  type Actions,
  type WidgetScreen,
} from '@c/widget/controller'
import type { PaymentWidget } from '@c/widget/widget'
import { getDefaultProfile } from '@shared/default-data'
import { API_URL, CDN_URL } from '@shared/defines'
import type { WidgetProfile } from '@shared/types'
import { sleep } from '@shared/utils'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'
import type {
  Message,
  MessageFromIframe,
} from '~/components/widget/WidgetPreview'

const DOT_PATTERN_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="2" fill="white" fill-opacity="0.5" /></svg>`

const SCREENS: { id: WidgetScreen; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'amount', label: 'Amount' },
  { id: 'details', label: 'Details' },
  { id: 'authorizing', label: 'Authorizing' },
  { id: 'success', label: 'Success' },
]

export default function WidgetPreviewRoute() {
  const [profile, setProfile] = useState<WidgetProfile>(() =>
    getDefaultProfile('widget'),
  )
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeScreen, setActiveScreen] = useState<WidgetScreen>('home')
  const [isWidgetOpen, setIsWidgetOpen] = useState(true)

  const mainContainerRef = useRef<HTMLDivElement>(null)
  const mainWidgetRef = useRef<PaymentWidget | null>(null)
  const mainActionsRef = useRef<Actions | null>(null)

  const thumbRefs = useRef<Map<WidgetScreen, HTMLDivElement>>(new Map())
  const thumbWidgetsRef = useRef<Map<WidgetScreen, PaymentWidget>>(new Map())

  const NAME = 'wm-payment-widget'

  useEffect(() => {
    const load = async () => {
      if (!customElements.get(NAME)) {
        const { PaymentWidget } =
          await import('@tools/components/widget/index.js')
        if (!customElements.get(NAME)) {
          customElements.define(NAME, PaymentWidget)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  // Mount main widget and thumbnails
  useEffect(() => {
    if (!isLoaded) return

    // 1. Create main widget
    if (mainContainerRef.current && !mainWidgetRef.current) {
      const el = document.createElement(NAME) as PaymentWidget
      el.embedded = true
      el.hideTrigger = true
      el.isOpen = true
      el.screen = activeScreen
      el.config = {
        apiUrl: API_URL,
        cdnUrl: CDN_URL,
        receiverAddress: 'https://example.com',
        profile,
      }

      const actions = el.setController({
        isPreviewMode: true,
        getWallet: NO_OP_CONTROLLER.getWallet,
        probeWalletCompatibility: NO_OP_CONTROLLER.probeWalletCompatibility,
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

      el.addEventListener('screen-change', (ev: Event) => {
        const customEv = ev as CustomEvent<{ screen: WidgetScreen }>
        if (customEv.detail?.screen) {
          setActiveScreen(customEv.detail.screen)
        }
      })

      el.addEventListener('widget-toggle', (ev: Event) => {
        const customEv = ev as CustomEvent<{ isOpen: boolean }>
        if (typeof customEv.detail?.isOpen === 'boolean') {
          setIsWidgetOpen(customEv.detail.isOpen)
        }
      })

      mainWidgetRef.current = el
      mainActionsRef.current = actions
      mainContainerRef.current.appendChild(el)
    }

    // 2. Create thumbnails
    SCREENS.forEach(({ id }) => {
      const container = thumbRefs.current.get(id)
      if (container && !thumbWidgetsRef.current.has(id)) {
        const thumbEl = document.createElement(NAME) as PaymentWidget
        thumbEl.embedded = true
        thumbEl.hideTrigger = true
        thumbEl.isOpen = true
        thumbEl.screen = id
        thumbEl.config = {
          apiUrl: API_URL,
          cdnUrl: CDN_URL,
          receiverAddress: 'https://example.com',
          profile,
        }
        thumbEl.setController({
          isPreviewMode: true,
          getWallet: NO_OP_CONTROLLER.getWallet,
          probeWalletCompatibility: NO_OP_CONTROLLER.probeWalletCompatibility,
          fetchQuote: NO_OP_CONTROLLER.fetchQuote,
          initiatePayment: NO_OP_CONTROLLER.initiatePayment,
          getStatus: NO_OP_CONTROLLER.getStatus,
        })
        thumbEl.setScreen(id)

        thumbWidgetsRef.current.set(id, thumbEl)
        container.appendChild(thumbEl)
      }
    })

    postMessage({ type: 'READY' })

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const newProfile = ev.data.profile
        setProfile(newProfile)

        // Update main widget
        if (mainWidgetRef.current) {
          mainWidgetRef.current.config = {
            apiUrl: API_URL,
            cdnUrl: CDN_URL,
            receiverAddress: 'https://example.com',
            profile: newProfile,
          }
          mainWidgetRef.current.isOpen = true
        }

        // Update thumbnails
        thumbWidgetsRef.current.forEach((widget) => {
          widget.config = {
            apiUrl: API_URL,
            cdnUrl: CDN_URL,
            receiverAddress: 'https://example.com',
            profile: newProfile,
          }
          widget.isOpen = true
        })
      }
    }

    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [isLoaded])

  // Handle screen switch
  const handleSelectScreen = (screen: WidgetScreen) => {
    setActiveScreen(screen)
    if (mainActionsRef.current) {
      mainActionsRef.current.setScreen(screen)
    } else if (mainWidgetRef.current) {
      mainWidgetRef.current.setScreen(screen)
    }
    if (mainWidgetRef.current && !mainWidgetRef.current.isOpen) {
      mainWidgetRef.current.isOpen = true
      setIsWidgetOpen(true)
    }
  }

  const handleToggleWidget = () => {
    if (mainWidgetRef.current) {
      mainWidgetRef.current.isOpen = !mainWidgetRef.current.isOpen
      setIsWidgetOpen(mainWidgetRef.current.isOpen)
    }
  }

  const triggerIcon = profile.icon?.value || wmLogo
  const triggerBg =
    typeof profile.icon?.color === 'string'
      ? profile.icon.color
      : (profile.icon?.color?.gradient ?? '#ffffff')

  const dotPattern = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? btoa(DOT_PATTERN_SVG) : Buffer.from(DOT_PATTERN_SVG).toString('base64')}`

  return (
    <div
      id="preview-container"
      className="relative w-full h-full min-h-[640px] flex flex-col justify-between p-6 select-none overflow-hidden"
      style={{
        backgroundImage: `url("${dotPattern}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '16px 16px',
        backgroundColor: '#f3f4f6',
      }}
    >
      {/* Top Left Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-xs text-xs font-normal text-gray-700 select-none z-20">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-500"
        >
          <rect
            x="1.5"
            y="3"
            width="13"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4.5 8C5.5 6.5 6.5 6 8 6C9.5 6 10.5 6.5 11.5 8C10.5 9.5 9.5 10 8 10C6.5 10 5.5 9.5 4.5 8Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="8" cy="8" r="1" fill="currentColor" />
        </svg>
        <span>this is a preview</span>
      </div>

      {/* Main Content Area: Centered Widget + Vertical Thumbnails */}
      <div className="flex-1 flex items-center justify-center gap-4 py-8">
        {/* Main Widget Dialog */}
        <div className="flex justify-center" ref={mainContainerRef}>
          {/* Main widget gets injected here */}
        </div>

        {/* Vertical Thumbnails */}
        <div className="flex flex-col gap-2.5 z-10">
          {SCREENS.map((s) => {
            const isSelected = activeScreen === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectScreen(s.id)}
                aria-label={`Preview ${s.label} screen`}
                className={`relative w-[68px] h-[104px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-gray-900 border-2 border-gray-900 shadow-sm'
                    : 'border border-gray-200 hover:border-gray-400 opacity-90 hover:opacity-100 shadow-2xs'
                }`}
              >
                <div
                  className="w-[340px] h-[520px] origin-top-left pointer-events-none select-none"
                  style={{ transform: 'scale(0.2)' }}
                  ref={(node) => {
                    if (node) {
                      thumbRefs.current.set(s.id, node)
                    } else {
                      thumbRefs.current.delete(s.id)
                    }
                  }}
                >
                  {/* Thumbnail widget gets injected here */}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Right Floating Launcher Trigger */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={handleToggleWidget}
          aria-expanded={isWidgetOpen}
          aria-label="Toggle payment widget"
          className="w-14 h-14 rounded-full p-[1.5px] shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          style={{
            background:
              'conic-gradient(from 180deg, #e8595a, #f0a03a, #56b7b5, #7f76b2, #e8595a)',
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: triggerBg }}
          >
            <img src={triggerIcon} alt="" className="w-8 h-8 select-none" />
          </div>
        </button>
      </div>
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}
