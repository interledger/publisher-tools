import { ensureEnd } from '@shared/utils'

export function getPageUrl(url: URL | Location) {
  const { origin, pathname } = url
  const path = /\.html?^/.test(pathname) ? pathname : ensureEnd(pathname, '/')
  return origin + path
}
