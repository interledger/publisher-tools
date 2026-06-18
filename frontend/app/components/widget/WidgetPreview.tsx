import { useEffect, useRef } from 'react'
import { subscribe } from 'valtio'
import { deepClone } from 'valtio/utils'
import type { WidgetProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { widget } from '~/stores/widget-store'

export type Message = { action: 'UPDATE'; profile: WidgetProfile }

export type MessageFromIframe = { type: 'READY' }

export const WidgetPreview = () => {
  const ref = useRef<ToolPreviewHandle<Message>>(null)

  const messageHandler = (data: MessageFromIframe) => {
    switch (data.type) {
      case 'READY':
        return ref.current?.postMessage(UpdateUIMessage())
    }
  }

  useEffect(() => {
    return subscribe(widget.profile, () => {
      ref.current?.postMessage(UpdateUIMessage())
    })
  }, [])

  return (
    <ToolPreview tool="widget" ref={ref} onMessage={messageHandler}>
      {/* no actions/controllers needed here */}
    </ToolPreview>
  )
}

function UpdateUIMessage(): Message {
  return { action: 'UPDATE', profile: deepClone(widget.profile) }
}
