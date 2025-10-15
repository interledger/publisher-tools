import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import type { BannerConfig, Banner as BannerElement } from '@tools/components'
import { useSnapshot } from 'valtio'
import { toolState } from '~/stores/toolStore'

export interface BannerHandle {
  triggerPreview: () => void
}

interface Props {
  cdnUrl: string
  ref?: React.Ref<BannerHandle>
}

export const BannerPreview = ({
  cdnUrl,
  ref
}: React.PropsWithChildren<Props>) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const snap = useSnapshot(toolState.currentConfig)
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const bannerElementRef = useRef<BannerElement | null>(null)

  useImperativeHandle(ref, () => ({
    triggerPreview: () => {
      if (bannerElementRef.current) {
        bannerElementRef.current.previewAnimation()
      }
    }
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

  const bannerConfig = useMemo(() => {
    return {
      cdnUrl,
      bannerTitleText: snap.bannerTitleText,
      bannerDescriptionText: snap.bannerDescriptionText,
      isBannerDescriptionVisible: snap.bannerDescriptionVisible,
      bannerPosition: snap.bannerPosition,
      bannerBorderRadius: snap.bannerBorder,
      bannerSlideAnimation: snap.bannerSlideAnimation,
      bannerThumbnail: snap.bannerThumbnail,
      theme: {
        backgroundColor: snap.bannerBackgroundColor,
        textColor: snap.bannerTextColor,
        fontSize: snap.bannerFontSize,
        fontFamily: snap.bannerFontName
      }
    } as BannerConfig
  }, [snap, cdnUrl])

  useEffect(() => {
    if (bannerContainerRef.current && isLoaded) {
      if (bannerElementRef.current) {
        bannerElementRef.current.config = bannerConfig
        return
      }

      const bannerElement = document.createElement('wm-banner') as BannerElement
      bannerElement.config = bannerConfig
      bannerElementRef.current = bannerElement

      bannerContainerRef.current.appendChild(bannerElement)
    }
  }, [bannerConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div
      ref={bannerContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    />
  )
}

BannerPreview.displayName = 'BannerPreview'
