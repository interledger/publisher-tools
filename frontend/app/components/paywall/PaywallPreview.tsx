import { useEffect, useRef } from 'react'
import { subscribe } from 'valtio'
import { deepClone } from 'valtio/utils'
import { BuilderBackground } from '@/components/BuilderBackground'
import type { PaywallProfile } from '@shared/types'
import { paywall } from '~/stores/paywall-store'

export type Message = {
  action: 'UPDATE'
  profile: PaywallProfile
}

export function PaywallPreview() {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    window.addEventListener(
      'message',
      (ev) => ev.origin === location.origin && updateUI(ref.current),
      { once: true },
    )
    return subscribe(paywall.profile, () => updateUI(ref.current))
  }, [])

  return (
    <BuilderBackground iframeMode={true}>
      <iframe
        ref={ref}
        onLoad={(ev) => updateUI(ev.currentTarget)}
        src="/tools/paywall/preview"
        className="w-full overflow-hidden border-none"
        style={{ height: 'clamp(25rem, 85vh, 46rem)' }}
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

function postMessage(iframeEl: HTMLIFrameElement, message: Message) {
  iframeEl.contentWindow!.postMessage(message, location.origin)
}
