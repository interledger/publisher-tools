import { API_URL, CDN_URL } from '@shared/defines'

export { API_URL, CDN_URL }
// The tests run their own frontend, with the wallet lookup mocked, on a port
// that doesn't clash with a dev server
export const FRONTEND_PORT = 3100
// Matches APP_BASEPATH in frontend/app/lib/constants.ts
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}/tools/`
// Matches the dev port in localenv/s3/wrangler.jsonc
export const S3_URL = 'http://localhost:8081'
