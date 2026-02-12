import { useEffect, useMemo, useRef } from 'react'
import type { OfferwallModal } from '@c/index'
import type { Controller } from '@c/offerwall/controller'
import { useOfferwallProfile } from '~/stores/offerwall-store'

interface Props {
  cdnUrl: string
}

export default function OfferwallPreview({ cdnUrl }: Props) {
  const [profile] = useOfferwallProfile()
  const offerwallRef = useRef<OfferwallModal>(null)

  useEffect(() => {
    const name = 'wm-offerwall'
    const load = async () => {
      if (!customElements.get(name)) {
        const { OfferwallModal } =
          await import('@tools/components/offerwall/index')
        if (!customElements.get(name)) {
          customElements.define(name, OfferwallModal)
        }
      }

      const el = document.querySelector<OfferwallModal>('wm-offerwall')!
      const controller: Controller = {
        onModalClose: (ev) => {
          console.log('onModalClose')
          console.log('showing offerwall options')
        },
        onExtensionLinkClick(ev) {
          console.log('onExtensionLinkClick')
          ev.preventDefault()
          setTimeout(() => {
            el.setScreen('all-set')
          }, 100)
        },
        onDone(ev) {
          console.log('onDone')
          // ev.preventDefault()
        },
        isPreviewMode: true,
      }
      el.setController(controller)

      // setTimeout(() => {
      // el.setScreen('contribution-required')
      // }, 5000)
    }
    load()
  }, [])

  const offerwallConfig = useMemo(
    () => ({ profile, cdnUrl }),
    [profile, cdnUrl],
  )
  useEffect(() => {
    if (offerwallRef.current) {
      const offerwall = offerwallRef.current
      offerwall.config = offerwallConfig
    }
  }, [offerwallConfig])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <wm-offerwall ref={offerwallRef} />
    </div>
  )
}
