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

export function PaywallPreview() {
  const [currentView, setCurrentView] = useState<keyof View>('home')
  const ref = useRef<HTMLIFrameElement>(null)

  const messageHandler = (ev: MessageEvent<MessageFromIframe>) => {
    if (ev.origin !== location.origin) return
    switch (ev.data.type) {
      case 'READY':
        return updateUI(ref.current)
      case 'CURRENT_SCREEN':
        return setCurrentView(ev.data.view)
    }
  }

  useEffect(() => {
    window.addEventListener('message', messageHandler)
    const unsub = subscribe(paywall.profile, () => updateUI(ref.current))
    return () => {
      window.removeEventListener('message', messageHandler)
      unsub()
    }
  }, [])

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
      <iframe
        ref={ref}
        onLoad={(ev) => updateUI(ev.currentTarget)}
        src="/tools/paywall/preview"
        className="w-full overflow-hidden border-none"
        style={{ height: 'clamp(25rem, 70vh, 36rem)' }}
      ></iframe>
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
