import { createCookieSessionStorage } from 'react-router';

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: 'wmtools-session',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only use secure in production
      sameSite: 'lax', // changed from 'none' since we're using HTTP in dev
      secrets: [
        process.env.SESSION_COOKIE_SECRET_KEY || 'supersecretilpaystring'
      ]
    }
  })

export { getSession, commitSession, destroySession }
