import { Banner } from '@c/banner.js'
import { API_URL } from '@shared/defines'
import type { BannerProfile } from '@shared/types'
import { trackEventFactory } from './lib/analytics'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'

customElements.define('wm-banner', Banner)

const trackEvent = trackEventFactory('banner')
const params = getScriptParams('banner')

appendPaymentPointer(params.walletAddress)
if (shouldShowBanner()) {
  fetchProfile(API_URL, 'banner', params)
    .then((profile) => document.body.appendChild(drawBanner(profile)))
    .catch((error) => console.error(error))
}

function shouldShowBanner() {
  // check if user closed the banner
  const closedByUser = sessionStorage.getItem('_wm_tools_closed_by_user')

  // check if user / visitor has monetization
  const monetizationLinks = document.querySelector<HTMLLinkElement>(
    'link[rel=monetization]',
  )
  // skip the banner if the extension is installed
  return !(
    (monetizationLinks && monetizationLinks.relList.supports('monetization')) ||
    closedByUser
  )
}

function drawBanner(profile: BannerProfile) {
  const bannerElement = document.createElement('wm-banner')
  bannerElement.config = {
    ...profile,
    cdnUrl: params.cdnUrl,
  }

  bannerElement.addEventListener('banner-closed', () => {
    sessionStorage.setItem('_wm_tools_closed_by_user', 'true')
    trackEvent('banner_closed')
  })

  bannerElement.addEventListener(
    'click-extension-link',
    (e: CustomEvent<{ link: string }>) => {
      const { link } = e.detail
      trackEvent('click_extension_link', { link })
    },
  )

  const position = profile.position ? profile.position.toLowerCase() : 'bottom'

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
