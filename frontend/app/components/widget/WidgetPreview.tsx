import { useEffect, useRef } from 'react'
import { deepClone } from 'valtio/utils'
import type { WidgetProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { useWidgetProfile } from '~/stores/widget-store'

export type Message = { action: 'UPDATE'; profile: WidgetProfile }

export type MessageFromIframe = { type: 'READY' }

export const WidgetPreview = () => {
  const ref = useRef<ToolPreviewHandle<Message>>(null)
  const [profile] = useWidgetProfile()

  const messageHandler = (data: MessageFromIframe) => {
    switch (data.type) {
      case 'READY':
        return ref.current?.postMessage(UpdateUIMessage(profile))
    }
  }

  useEffect(() => {
    ref.current?.postMessage(UpdateUIMessage(profile))
  }, [profile])

  return (
    <ToolPreview tool="widget" ref={ref} onMessage={messageHandler}>
      {/* no actions/controllers needed here */}
    </ToolPreview>
  )
}

function UpdateUIMessage(profile: WidgetProfile): Message {
  return { action: 'UPDATE', profile: deepClone(profile) }
}
