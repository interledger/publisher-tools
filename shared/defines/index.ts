declare const BUILD_API_URL: string
declare const BUILD_CDN_URL: string

const DEV_API_URL = 'http://localhost:8787'
const DEV_CDN_URL = 'http://localhost:5173'
const DEV_FRONTEND_URL = 'http://localhost:3000/tools/' // contains trailing slash and pathname.

export const APP_URL = {
  production: 'https://webmonetization.org',
  staging: 'https://staging-publisher-tools.webmonetization.workers.dev',
  development: new URL(DEV_FRONTEND_URL).origin
}

export const API_URL =
  typeof BUILD_API_URL === 'string' && BUILD_API_URL
    ? BUILD_API_URL
    : DEV_API_URL

export const CDN_URL =
  typeof BUILD_CDN_URL === 'string' && BUILD_CDN_URL
    ? BUILD_CDN_URL
    : DEV_CDN_URL
