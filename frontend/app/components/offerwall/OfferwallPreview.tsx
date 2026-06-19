import { useEffect, useRef } from 'react'
import { deepClone } from 'valtio/utils'
import { type OfferwallProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { useOfferwallProfile } from '~/stores/offerwall-store'

export type Message = { action: 'UPDATE'; profile: OfferwallProfile }

export type MessageFromIframe = { type: 'READY' }

export default function OfferwallPreview() {
  const [profile] = useOfferwallProfile()
  const ref = useRef<ToolPreviewHandle<Message>>(null)

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
    <ToolPreview tool="offerwall" ref={ref} onMessage={messageHandler}>
      {/* no actions/controllers needed here */}
    </ToolPreview>
  )
}

function UpdateUIMessage(profile: OfferwallProfile): Message {
  return { action: 'UPDATE', profile: deepClone(profile) }
}
