import { useEffect, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { subscribe } from 'valtio'
import { deepClone } from 'valtio/utils'
import { BuilderBackground } from '@/components/BuilderBackground'
import { ToolsSecondaryButton } from '@/components/ToolsSecondaryButton'
import type { View } from '@c/paywall/controller'
import type { PaywallProfile } from '@shared/types'
import { paywall } from '~/stores/paywall-store'

export type Message =
  | { action: 'RESET' }
  | { action: 'UPDATE'; profile: PaywallProfile }

export type MessageFromIframe =
  | { type: 'READY' }
  | { type: 'CURRENT_SCREEN'; view: keyof View }

const IFRAME_WIDTH_DESKTOP = 1400
const IFRAME_HEIGHT_DESKTOP = 900

const IFRAME_WIDTH_MOBILE = 380
const IFRAME_HEIGHT_MOBILE = 600

const TOGGLE_MEDIA_QUERY = '(min-width: 34rem)'

export function PaywallPreview() {
  const [currentView, setCurrentView] = useState<keyof View>('home')
  const ref = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [iframeSize, setIframeSize] = useState({
    width: IFRAME_WIDTH_DESKTOP,
    height: IFRAME_HEIGHT_DESKTOP,
  })

  const messageHandler = (ev: MessageEvent<MessageFromIframe>) => {
    if (ev.origin !== location.origin) return
    switch (ev.data.type) {
      case 'READY':
        return updateUI(ref.current)
      case 'CURRENT_SCREEN':
        return setCurrentView(ev.data.view)
    }
  }

  const updateScreenMode = (isDesktop: boolean) => {
    setIframeSize({
      width: isDesktop ? IFRAME_WIDTH_DESKTOP : IFRAME_WIDTH_MOBILE,
      height: isDesktop ? IFRAME_HEIGHT_DESKTOP : IFRAME_HEIGHT_MOBILE,
    })
  }

  useEffect(() => {
    window.addEventListener('message', messageHandler)
    const unsub = subscribe(paywall.profile, () => updateUI(ref.current))
    return () => {
      window.removeEventListener('message', messageHandler)
      unsub()
    }
  }, [])

  useEffect(() => {
    const listener = (ev: MediaQueryListEvent) => {
      updateScreenMode(ev.matches)
    }
    const media = window.matchMedia(TOGGLE_MEDIA_QUERY)
    updateScreenMode(media.matches)
    media.addEventListener('change', listener)
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [])

  useEffect(() => {
    const resizePreview = () => {
      const containerWidth = containerRef.current!.offsetWidth
      const scaleFactor = containerWidth / iframeSize.width
      ref.current!.style.setProperty('--scale', scaleFactor.toString())
    }
    resizePreview()
    window.addEventListener('resize', resizePreview)
    return () => {
      window.removeEventListener('resize', resizePreview)
    }
  }, [iframeSize.width])

  return (
    <BuilderBackground
      iframeMode={true}
      actions={
        <>
          <ToolsSecondaryButton
            icon="refresh"
            className={cx('w-[130px]', currentView === 'home' && 'invisible')}
            onClick={() => resetPaywall(ref.current)}
          >
            Reset
          </ToolsSecondaryButton>
        </>
      }
    >
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: `${iframeSize.width}/${iframeSize.height}` }}
        ref={containerRef}
      >
        <iframe
          ref={ref}
          src="/tools/paywall/preview"
          className="absolute top-0 left-0 origin-top-left border-none"
          style={{
            width: iframeSize.width + 'px',
            height: iframeSize.height + 'px',
            transform: 'scale(var(--scale, 0.5))',
          }}
        ></iframe>
      </div>
    </BuilderBackground>
  )
}

function updateUI(iframeEl: HTMLIFrameElement | null) {
  if (!iframeEl) return
  const profile = deepClone(paywall.profile)
  const message: Message = { action: 'UPDATE', profile }
  postMessage(iframeEl, message)
}

function resetPaywall(iframeEl: HTMLIFrameElement | null) {
  if (!iframeEl) return
  postMessage(iframeEl, { action: 'RESET' })
}

function postMessage(iframeEl: HTMLIFrameElement, message: Message) {
  iframeEl.contentWindow!.postMessage(message, location.origin)
}
