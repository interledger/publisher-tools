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
      (ev) => ev.origin === location.origin && postMessage(ref.current),
      { once: true },
    )
    return subscribe(paywall.profile, () => postMessage(ref.current))
  }, [])

  return (
    <BuilderBackground iframeMode={true}>
      <iframe
        ref={ref}
        onLoad={(ev) => postMessage(ev.currentTarget)}
        src="/tools/paywall/preview"
        className="w-full overflow-hidden border-none"
        style={{ height: 'clamp(25rem, 85vh, 46rem)' }}
      ></iframe>
    </BuilderBackground>
  )
}

function postMessage(iframeEl: HTMLIFrameElement | null) {
  const message: Message = {
    action: 'UPDATE',
    profile: deepClone(paywall.profile),
  }
  iframeEl?.contentWindow!.postMessage(message, location.origin)
}
