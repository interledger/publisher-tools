import { redirect } from 'react-router'
import { isGrantValidAndAccepted } from '~/utils/open-payments.server'
import { commitSession, getSession } from '~/utils/session.server'
import type { Route } from './+types/api.grant.$type'

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { env } = context.cloudflare

  const elementType = params.type
  const url = new URL(request.url)
  const interactRef = url.searchParams.get('interact_ref') || ''
  const result = url.searchParams.get('result') || ''

  const session = await getSession(request.headers.get('Cookie'))
  const walletAddress = session.get('wallet-address')
  const grant = session.get('payment-grant')

  let isGrantAccepted = false
  let grantResponse: string

  if (result === 'grant_rejected') {
    grantResponse = 'The grant request was declined.'
  } else if (!walletAddress || !grant || !interactRef) {
    grantResponse = 'Grant session is missing or expired. Please try again.'
  } else {
    try {
      isGrantAccepted = await isGrantValidAndAccepted(env, grant, interactRef)
      grantResponse = isGrantAccepted
        ? 'Wallet ownership confirmed!'
        : 'Grant could not be finalized. Please try again.'
    } catch (err) {
      grantResponse = 'Unable to verify grant. Please try again.'
    }
    if (isGrantAccepted) session.set('validForWallet', walletAddress.id)
    session.unset('payment-grant')
  }

  session.set('is-grant-accepted', isGrantAccepted)
  session.set('is-grant-response', true)
  session.set('grant-response', grantResponse)

  return redirect(`/${elementType}`, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}
