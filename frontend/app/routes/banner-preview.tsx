import { useEffect, useState } from 'react'
import { getDefaultProfile } from '@shared/default-data'
import { CDN_URL } from '@shared/defines'
import type { BannerProfile } from '@shared/types'
import type {
  Message,
  MessageFromIframe,
} from '~/components/banner/BannerPreview'

export default function BannerPreviewRoute() {
  const cdnUrl = CDN_URL
  const [profile, setProfile] = useState<BannerProfile>(() =>
    getDefaultProfile('banner'),
  )
  const [isLoaded, setIsLoaded] = useState(false)

  const NAME = 'wm-banner'
  useEffect(() => {
    const load = async () => {
      if (!customElements.get(NAME)) {
        const { Banner } = await import('@tools/components/banner')
        if (!customElements.get(NAME)) {
          customElements.define(NAME, Banner)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    const update = (profile: BannerProfile) => {
      el.config = { ...profile, cdnUrl }
    }

    const el = document.createElement(NAME)
    const container = document.getElementById('preview-container')!
    update(profile)
    container.appendChild(el)
    postMessage({ type: 'READY' })

    const listener = (ev: MessageEvent<Message>) => {
      if (ev.origin !== window.location.origin) return
      if (ev.data.action === 'UPDATE') {
        const profile = ev.data.profile
        setProfile(profile)
        update(profile)
      } else if (ev.data.action === 'RESET') {
        el.previewAnimation()
      }
    }

    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [isLoaded])

  return (
    <div id="preview-container">
      <PlaceholderContent />
      {/*<pre>{JSON.stringify(profile, null, 2)}</pre>*/}
      {/* element gets injected here */}
    </div>
  )
}

function postMessage(message: MessageFromIframe) {
  window.parent.postMessage(message, window.location.origin)
}

function PlaceholderContent() {
  const text = `Below 2,000 metres, almost nothing moves quickly.
    What looks empty on a sonar readout is a careful exchange between
    organisms that trade carbon, nitrogen, and light.
    For a long time we only measured it by what washed up.`

  return (
    <div className="p-4 space-y-2 select-none" role="presentation">
      <div className="text-style-h5">The quiet economy of the deep ocean</div>
      <div className="w-full h-[20vh] bg-gray-200"></div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
      <div className="text-style-body-standard">{text}</div>
    </div>
  )
}
