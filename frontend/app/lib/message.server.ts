import { type Session, type SessionData, redirect } from '@remix-run/node'
import { createCookieSessionStorage } from '@remix-run/node'

const ONE_MINUTE_IN_S = 60

export type MessageType = 'success' | 'error'
export type Message = { content: string; type: MessageType }
export type MessageStorageFlashData = {
  message: Message
}

export const parseBool = (str: string) => {
  return ['true', 't', '1'].includes(str.toLowerCase())
}

export const messageStorage = createCookieSessionStorage<
  SessionData,
  MessageStorageFlashData
>({
  cookie: {
    name: '__message',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ONE_MINUTE_IN_S,
    secrets: ['MY_SUPER_SECRET_TOKEN'],
    secure: process.env.ENABLE_INSECURE_MESSAGE_COOKIE
      ? !parseBool(process.env.ENABLE_INSECURE_MESSAGE_COOKIE)
      : process.env.NODE_ENV === 'production'
  }
})

export function setMessage(session: Session, message: Message) {
  session.flash('message', message)
}

export async function redirectWithMessage(location: string, session: Session) {
  return redirect(location, {
    headers: { 'Set-Cookie': await messageStorage.commitSession(session) }
  })
}

type MessageRedirectArgs = {
  session: Session
  location: string
  message: Message
}

export async function setMessageAndRedirect(args: MessageRedirectArgs) {
  args.session.flash('message', args.message)
  return redirectWithMessage(args.location, args.session)
}
