import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import type { BannerConfig, Banner as BannerElement } from '@tools/components'
import { toolActions } from '~/stores/toolStore'

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
  const profile = toolActions.useCurrentConfigSnapshot()
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
      bannerTitleText: profile.bannerTitleText,
      bannerDescriptionText: profile.bannerDescriptionText,
      isBannerDescriptionVisible: profile.bannerDescriptionVisible,
      bannerPosition: profile.bannerPosition,
      bannerBorderRadius: profile.bannerBorder,
      bannerSlideAnimation: profile.bannerSlideAnimation,
      bannerThumbnail: profile.bannerThumbnail,
      theme: {
        backgroundColor: profile.bannerBackgroundColor,
        textColor: profile.bannerTextColor,
        fontSize: profile.bannerFontSize,
        fontFamily: profile.bannerFontName
      }
    } as BannerConfig
  }, [profile, cdnUrl])

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
