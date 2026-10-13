import { API_URL, APP_URL, CDN_URL } from '@shared/defines'

export { API_URL, CDN_URL }
// Matches APP_BASEPATH in frontend/app/lib/constants.ts
export const FRONTEND_URL = new URL('/tools/', APP_URL.development).href
// Matches the dev port in localenv/s3/wrangler.jsonc
export const S3_URL = 'http://localhost:8081'
