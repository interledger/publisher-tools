import { createCookieSessionStorage } from 'react-router'
import type { BrowserContext } from '@playwright/test'
import { FRONTEND_URL } from './services'

// Matches the cookie in frontend/app/utils/session.server.ts
const { getSession, commitSession } = createCookieSessionStorage({
  cookie: {
    name: 'wmtools-session',
    httpOnly: true,
    sameSite: 'lax',
    secrets: [
      process.env.SESSION_COOKIE_SECRET_KEY || 'supersecretilpaystring',
    ],
  },
})

/**
 * Saving a profile needs a session that has proven ownership of the wallet,
 * which normally comes from approving a grant at the wallet provider. Signing
 * the session cookie here lets a test save without going through that flow.
 */
export async function authorizeWallet(
  context: BrowserContext,
  walletAddressId: string,
) {
  const session = await getSession()
  session.set('validForWallet', walletAddressId)
  const setCookie = await commitSession(session)
  const [nameAndValue] = setCookie.split(';')
  const separator = nameAndValue.indexOf('=')

  await context.addCookies([
    {
      name: nameAndValue.slice(0, separator),
      value: nameAndValue.slice(separator + 1),
      domain: new URL(FRONTEND_URL).hostname,
      // Same path as the cookie the frontend sets, so it replaces this one
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}
