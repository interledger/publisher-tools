import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import type { OfferwallModal } from '@c/index'
import type { Controller } from '@c/offerwall/controller'
import { applyFontFamily } from '@c/utils'
import {
  BORDER_RADIUS,
  TOOL_OFFERWALL,
  type OfferwallProfile,
} from '@shared/types'
import { useOfferwallProfile } from '~/stores/offerwall-store'
import { toolState } from '~/stores/toolStore'

export default function OfferwallPreview() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile] = useOfferwallProfile()
  const offerwallRef = useRef<OfferwallModal>(null)
  const snap = useSnapshot(toolState)

  const setCssVars = (elem: OfferwallModal, profile: OfferwallProfile) => {
    applyFontFamily(elem, profile.font.name, TOOL_OFFERWALL, snap.cdnUrl)

    elem.style.setProperty(
      '--wm-border-radius',
      BORDER_RADIUS[profile.border.type],
    )

    const { background, text, theme, headline } = profile.color
    elem.style.setProperty('--wm-text-color', text)
    elem.style.setProperty('--wm-heading-color', headline)
    elem.style.setProperty(
      '--wm-background',
      typeof background === 'string' ? background : '', // TODO: handle gradient,
    )
    elem.style.setProperty(
      '--wm-accent-color',
      typeof theme === 'string' ? theme : '', // TODO: handle gradient,
    )
  }

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
          ev.preventDefault()
          console.log('onModalClose')
          console.log('showing offerwall options')
        },
        onExtensionLinkClick(ev) {
          console.log('onExtensionLinkClick')
          ev.preventDefault()
          setTimeout(() => {
            el.setScreen('all-set')
          }, 500)
        },
        onDone(ev) {
          console.log('onDone')
          ev.preventDefault()
          el.setScreen('install-required')
        },
        isPreviewMode: true,
      }
      el.setController(controller)

      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (offerwallRef.current && isLoaded) {
      const offerwall = offerwallRef.current
      setCssVars(offerwall, profile)
    }
  }, [profile, isLoaded])
  return (
    <div className="relative w-full h-[744px]">
      <wm-offerwall ref={offerwallRef} />
    </div>
  )
}
