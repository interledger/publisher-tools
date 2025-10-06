import { Banner } from '@tools/components/banner'
import { API_URL } from '@shared/defines'
import type { BannerConfig } from '@shared/types'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'

customElements.define('wm-banner', Banner)

const params = getScriptParams('banner')

appendPaymentPointer(params.walletAddress)
fetchProfile(API_URL, 'banner', params)
  .then((config) => {
    const el = drawBanner(config)
    if (el) {
      document.body.appendChild(el)
    }
  })
  .catch((error) => console.error(error))

function drawBanner(config: BannerConfig) {
  // check if user closed the banner
  const closedByUser = sessionStorage.getItem('_wm_tools_closed_by_user')

  // check if user / visitor has monetization
  const monetizationLinks = document.querySelector<HTMLLinkElement>(
    'link[rel=monetization]'
  )
  if (
    (monetizationLinks && monetizationLinks.relList.supports('monetization')) ||
    closedByUser
  ) {
    // prevent element being created, if the extension is installed
    return
  }

  const bannerElement = document.createElement('wm-banner')

  const bannerConfig = {
    cdnUrl: params.cdnUrl,
    bannerTitleText: config.bannerTitleText,
    bannerDescriptionText: config.bannerDescriptionText,
    isBannerDescriptionVisible: config.bannerDescriptionVisible,
    bannerBorderRadius: config.bannerBorder,
    bannerPosition: config.bannerPosition,
    bannerSlideAnimation: config.bannerSlideAnimation,
    bannerThumbnail: config.bannerThumbnail,
    theme: {
      backgroundColor: config.bannerBackgroundColor,
      textColor: config.bannerTextColor,
      fontFamily: config.bannerFontName,
      fontSize: config.bannerFontSize
    }
  }
  bannerElement.config = bannerConfig

  const position = config.bannerPosition
    ? config.bannerPosition.toLowerCase()
    : 'bottom'

  bannerElement.style.position = 'fixed'
  bannerElement.style.left = '0'
  bannerElement.style.right = '0'
  bannerElement.style.zIndex = '9999'

  if (position === 'top') {
    bannerElement.style.top = '0'
  } else {
    bannerElement.style.bottom = '0'
  }

  return bannerElement
}
