import { useEffect, useRef } from 'react'
import { subscribe } from 'valtio'
import { deepClone } from 'valtio/utils'
import { type OfferwallProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { offerwall } from '~/stores/offerwall-store'

export type Message = { action: 'UPDATE'; profile: OfferwallProfile }

export type MessageFromIframe = { type: 'READY' }

export default function OfferwallPreview() {
  const ref = useRef<ToolPreviewHandle<Message>>(null)

  const messageHandler = (data: MessageFromIframe) => {
    switch (data.type) {
      case 'READY':
        return ref.current?.postMessage(UpdateUIMessage())
    }
  }

  useEffect(() => {
    return subscribe(offerwall.profile, () => {
      ref.current?.postMessage(UpdateUIMessage())
    })
  }, [])

  return (
    <ToolPreview tool="offerwall" ref={ref} onMessage={messageHandler}>
      {/* no actions/controllers needed here */}
    </ToolPreview>
  )
}

function UpdateUIMessage(): Message {
  return { action: 'UPDATE', profile: deepClone(offerwall.profile) }
}
