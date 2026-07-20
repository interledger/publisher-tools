import { createCookieSessionStorage } from 'react-router'
import type { PendingGrant, WalletAddress } from '@interledger/open-payments'
import type { GrantOutcome } from '~/lib/types'

type SessionData = {
  'is-grant-accepted': boolean
  'is-grant-response': boolean
  'grant-response': GrantOutcome
  'payment-grant': PendingGrant
  'wallet-address': WalletAddress
  'validForWallet': WalletAddress['id']
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: 'wmtools-session',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only use secure in production
      sameSite: 'lax', // changed from 'none' since we're using HTTP in dev
      secrets: [
        process.env.SESSION_COOKIE_SECRET_KEY || 'supersecretilpaystring',
      ],
    },
  })

export { getSession, commitSession, destroySession }
