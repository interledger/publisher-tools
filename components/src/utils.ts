/**
 * Gets the appropriate Web Monetization extension download link based on the user agent
 * @param userAgent - The user agent string from navigator.userAgent
 * @returns The download URL for the Web Monetization extension
 */
export const getWebMonetizationLinkHref = (userAgent: string): string => {
  if (userAgent.includes('Firefox')) {
    return 'https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/'
  } else if (
    userAgent.includes('Chrome') &&
    !userAgent.includes('Edg') &&
    !userAgent.includes('OPR')
  ) {
    return 'https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii'
  } else if (userAgent.includes('Edg')) {
    return 'https://microsoftedge.microsoft.com/addons/detail/web-monetization/imjgemgmeoioefpmfefmffbboogighjl'
  }
  return 'https://webmonetization.org/'
}
