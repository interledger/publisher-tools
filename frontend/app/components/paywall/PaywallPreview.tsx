import { useEffect, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { subscribe } from 'valtio'
import { deepClone } from 'valtio/utils'
import { ToolsSecondaryButton } from '@/components/ToolsSecondaryButton'
import type { View } from '@c/paywall/controller'
import type { PaywallProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { paywall } from '~/stores/paywall-store'

export type Message =
  | { action: 'RESET' }
  | { action: 'UPDATE'; profile: PaywallProfile }

export type MessageFromIframe =
  | { type: 'READY' }
  | { type: 'CURRENT_SCREEN'; view: keyof View }

export function PaywallPreview() {
  const [currentView, setCurrentView] = useState<keyof View>('home')
  const ref = useRef<ToolPreviewHandle<Message>>(null)

  const messageHandler = (data: MessageFromIframe) => {
    switch (data.type) {
      case 'READY':
        return ref.current?.postMessage(UpdateUIMessage())
      case 'CURRENT_SCREEN':
        return setCurrentView(data.view)
    }
  }

  useEffect(() => {
    return subscribe(paywall.profile, () => {
      ref.current?.postMessage(UpdateUIMessage())
    })
  }, [])

  return (
    <ToolPreview tool="paywall" ref={ref} onMessage={messageHandler}>
      <ToolsSecondaryButton
        icon="refresh"
        className={cx('w-[130px]', currentView === 'home' && 'invisible')}
        onClick={() => ref.current!.postMessage({ action: 'RESET' })}
      >
        Reset
      </ToolsSecondaryButton>
    </ToolPreview>
  )
}

function UpdateUIMessage(): Message {
  return { action: 'UPDATE', profile: deepClone(paywall.profile) }
}
