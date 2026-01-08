import { data, type ActionFunctionArgs } from 'react-router'
import z from 'zod'
import { AWS_PREFIX } from '@shared/defines'
import { type Configuration, type ProfileId, PROFILE_IDS } from '@shared/types'
import { getWalletAddress, normalizeWalletAddress } from '@shared/utils'
import { APP_BASEPATH } from '~/lib/constants.js'
import { ConfigStorageService } from '~/utils/config-storage.server.js'
import { createInteractiveGrant } from '~/utils/open-payments.server.js'
import { commitSession, getSession } from '~/utils/session.server.js'
import { Banner } from '~/utils/validate.shared'

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({ error: 'Method not allowed' }, { status: 405 })
  }

  const { env } = context.cloudflare
  const url = new URL(request.url)
  const walletAddress = url.searchParams.get('walletAddress')
  const profileId = url.searchParams.get('profileId') as ProfileId | null

  if (!walletAddress) {
    return data(
      { error: 'walletAddress query param required' },
      { status: 400 }
    )
  }
  if (!profileId || !PROFILE_IDS.includes(profileId)) {
    return data({ error: 'Invalid profileId' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parsed = Banner.safeParse(body)
    if (!parsed.success) {
      const errors = z.treeifyError(parsed.error)
      return data({ errors }, { status: 400 })
    }

    const walletAddressData = await getWalletAddress(walletAddress)

    const session = await getSession(request.headers.get('Cookie'))
    const validForWallet = session.get('validForWallet')
    session.set('wallet-address', walletAddressData)

    if (!validForWallet || validForWallet !== walletAddressData.id) {
      const baseUrl = url.origin + APP_BASEPATH
      const grant = await createInteractiveGrant(env, {
        walletAddress: walletAddressData,
        redirectUrl: `${baseUrl}/api/grant/banner-two/`
      })
      session.set('payment-grant', grant)

      return data(
        { grantRequired: grant.interact.redirect, success: false },
        { status: 200, headers: { 'Set-Cookie': await commitSession(session) } }
      )
    }

    const walletAddressId = normalizeWalletAddress(walletAddressData)
    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })
    let config: Configuration = {
      $walletAddress: walletAddress,
      $walletAddressId: walletAddressId,
      $modifiedAt: new Date().toISOString()
    }

    try {
      config = await storage.getJson<Configuration>(walletAddressId)
    } catch (e) {
      const err = e as Error
      if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
        throw e
      }
    }

    await storage.putJson(walletAddressId, {
      ...config,
      banner: {
        ...config.banner,
        [profileId]: {
          ...parsed.data,
          $modifiedAt: new Date().toISOString()
        }
      }
    })

    return data({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Save profile error: ', error)
    return data(
      { error: `Failed to save profile: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
