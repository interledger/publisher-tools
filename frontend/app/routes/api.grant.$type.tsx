import { redirect, type LoaderFunctionArgs } from 'react-router'
import { commitSession, getSession } from '~/utils/session.server'
import { isGrantValidAndAccepted } from '~/utils/open-payments.server'

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare

  const elementType = params.type
  const url = new URL(request.url)
  const interactRef = url.searchParams.get('interact_ref') || ''
  const result = url.searchParams.get('result') || ''

  const session = await getSession(request.headers.get('Cookie'))
  const walletAddress = session.get('wallet-address')
  const grant = session.get('payment-grant')

  const isGrantResponse = true
  let grantResponse = result == 'grant_rejected' ? 'Grant was declined' : ''
  let isGrantAccepted = false

  if (walletAddress && grant && interactRef) {
    try {
      isGrantAccepted = await isGrantValidAndAccepted(env, grant, interactRef)
    } catch (_err) {
      isGrantAccepted = false
    }
    if (isGrantAccepted) {
      grantResponse = 'Wallet ownership confirmed!'
      session.set('validForWallet', walletAddress.id)
    }
    session.unset('payment-grant')
  }

  session.set('is-grant-accepted', isGrantAccepted)
  session.set('is-grant-response', isGrantResponse)
  session.set('grant-response', grantResponse)

  return redirect(`/${elementType}`, {
    headers: {
      'Set-Cookie': await commitSession(session)
    }
  })
}
