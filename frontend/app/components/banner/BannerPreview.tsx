import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Banner as BannerElement } from '@tools/components'
import { useBannerProfile } from '~/stores/banner-store'
export interface BannerHandle {
  triggerPreview: () => void
}

interface Props {
  cdnUrl: string
  ref?: React.Ref<BannerHandle>
}

export const BannerPreview = ({
  cdnUrl,
  ref,
}: React.PropsWithChildren<Props>) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile] = useBannerProfile()
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const bannerElementRef = useRef<BannerElement | null>(null)

  useImperativeHandle(ref, () => ({
    triggerPreview: () => {
      if (bannerElementRef.current) {
        bannerElementRef.current.previewAnimation()
      }
    },
  }))

  useEffect(() => {
    const loadBannerElement = async () => {
      if (!customElements.get('wm-banner')) {
        // dynamic import - ensure component only runs on the client side and not on SSR
        const { Banner } = await import('@tools/components/banner')
        if (!customElements.get('wm-banner')) {
          customElements.define('wm-banner', Banner)
        }
      }
      setIsLoaded(true)
    }

    loadBannerElement()
  }, [])

  const bannerProfile = useMemo(() => {
    return {
      ...profile,
      cdnUrl,
    }
  }, [profile, cdnUrl])

  useEffect(() => {
    if (bannerContainerRef.current && isLoaded) {
      if (bannerElementRef.current) {
        bannerElementRef.current.profile = bannerProfile
        return
      }

      const bannerElement = document.createElement('wm-banner') as BannerElement
      bannerElement.profile = bannerProfile
      bannerElementRef.current = bannerElement

      bannerContainerRef.current.appendChild(bannerElement)
    }
  }, [bannerProfile, isLoaded])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div
      ref={bannerContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    />
  )
}

BannerPreview.displayName = 'BannerPreview'
