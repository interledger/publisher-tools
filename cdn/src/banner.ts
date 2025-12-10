import { API_URL } from '@shared/defines'
import type { BannerConfig } from '@shared/types'
import { Banner } from '@tools/components/banner'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'

customElements.define('wm-banner', Banner)

const params = getScriptParams('banner')

appendPaymentPointer(params.walletAddress)
fetchProfile(API_URL, 'banner', params)
  .then((profile) => {
    const el = drawBanner(profile)
    if (el) {
      document.body.appendChild(el)
    }
  })
  .catch((error) => console.error(error))

function drawBanner(profile: BannerConfig) {
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

  const bannerProfile = {
    cdnUrl: params.cdnUrl,
    bannerTitleText: profile.bannerTitleText,
    bannerDescriptionText: profile.bannerDescriptionText,
    isBannerDescriptionVisible: profile.bannerDescriptionVisible,
    bannerBorderRadius: profile.bannerBorder,
    bannerPosition: profile.bannerPosition,
    bannerSlideAnimation: profile.bannerSlideAnimation,
    bannerThumbnail: profile.bannerThumbnail,
    theme: {
      backgroundColor: profile.bannerBackgroundColor,
      textColor: profile.bannerTextColor,
      fontFamily: profile.bannerFontName,
      fontSize: profile.bannerFontSize
    }
  }
  bannerElement.config = bannerProfile

  const position = profile.bannerPosition
    ? profile.bannerPosition.toLowerCase()
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
