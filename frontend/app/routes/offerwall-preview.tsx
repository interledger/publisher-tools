import { useEffect, useState } from 'react'
import type { OfferwallModal } from '@c/offerwall'
import { applyFontFamily } from '@c/utils'
import { getDefaultProfile } from '@shared/default-data'
import { CDN_URL } from '@shared/defines'
import type { OfferwallProfile } from '@shared/types'
import { BORDER_RADIUS, TOOL_OFFERWALL } from '@shared/types'
import type {
  Message,
  MessageFromIframe,
} from '~/components/offerwall/OfferwallPreview'
import { ToolPreviewPlaceholder } from '~/components/ToolPreviewPlaceholder'

export default function OfferwallPreviewRoute() {
  const [profile, setProfile] = useState(() => getDefaultProfile('offerwall'))
  const [isLoaded, setIsLoaded] = useState(false)

  const NAME = 'wm-offerwall'
  useEffect(() => {
    const load = async () => {
      if (!customElements.get(NAME)) {
        const { OfferwallModal } =
          await import('@tools/components/offerwall/index')
        if (!customElements.get(NAME)) {
          customElements.define(NAME, OfferwallModal)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const update = (profile: OfferwallProfile) => {
      setCssVars(el, profile)
    }

    const el = document.createElement(NAME)
    const actions = el.setController({
      onModalClose: (ev) => {
        ev.preventDefault()
        console.log('onModalClose')
        console.log('showing offerwall options')
      },
      onExtensionLinkClick(ev) {
        console.log('onExtensionLinkClick')
        ev.preventDefault()
        setTimeout(() => {
          actions.setScreen('all-set')
        }, 500)
      },
      onDone(ev) {
        console.log('onDone')
        ev.preventDefault()
        actions.setScreen('install-required')
      },
      isPreviewMode: true,
    })

    const container = document.getElementById('preview-container')!
    container.appendChild(el)
    postMessage({ type: 'READY' })

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const profile = ev.data.profile
        setProfile(profile)
        update(profile)
      }
    }

    update(profile)
    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [isLoaded])

  return (
    <div id="preview-container">
      <ToolPreviewPlaceholder />
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
      {/* element gets injected here */}
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}

const setCssVars = (elem: OfferwallModal, profile: OfferwallProfile) => {
  const fontBaseUrl = new URL('/assets/fonts/', CDN_URL).href
  applyFontFamily(elem, profile.font.name, TOOL_OFFERWALL, fontBaseUrl)

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
