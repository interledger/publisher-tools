import { useEffect, useRef, useState } from 'react'
import { cx } from 'class-variance-authority'
import { deepClone } from 'valtio/utils'
import { ToolsSecondaryButton } from '@/components/ToolsSecondaryButton'
import type { BannerProfile } from '@shared/types'
import { ToolPreview, type ToolPreviewHandle } from '~/components/ToolPreview'
import { useBannerProfile } from '~/stores/banner-store'

export type Message =
  { action: 'RESET' } | { action: 'UPDATE'; profile: BannerProfile }

export type MessageFromIframe = { type: 'READY' }

export function BannerPreview() {
  const ref = useRef<ToolPreviewHandle<Message>>(null)
  const [isAnimationDisabled, setIsAnimationDisabled] = useState(false)
  const [profile] = useBannerProfile()

  const messageHandler = (data: MessageFromIframe) => {
    switch (data.type) {
      case 'READY':
        return ref.current?.postMessage(UpdateUIMessage(profile))
    }
  }

  useEffect(() => {
    setIsAnimationDisabled(profile.animation.type === 'None')
    ref.current?.postMessage(UpdateUIMessage(profile))
  }, [profile])

  return (
    <ToolPreview tool="banner" ref={ref} onMessage={messageHandler}>
      <ToolsSecondaryButton
        icon="play"
        className={cx('w-[130px]', isAnimationDisabled && 'invisible')}
        onClick={() => ref.current?.postMessage({ action: 'RESET' })}
      >
        Preview
      </ToolsSecondaryButton>
    </ToolPreview>
  )
}

function UpdateUIMessage(profile: BannerProfile): Message {
  return { action: 'UPDATE', profile: deepClone(profile) }
}
