import { useEffect } from 'react'
import {
  useLoaderData,
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { BuilderProfileTabs } from '@/components'
import { BannerBuilder } from '~/components/banner/BannerBuilder'
import { BannerPreview } from '~/components/banner/BannerPreview'
import { ToolLayoutWithPreview } from '~/components/ToolLayoutWithPreview'
import {
  actions,
  banner,
  bannerWallet,
  bannerWalletActions,
  hydrateProfilesFromStorage,
  hydrateSnapshotsFromStorage,
  loadBannerWallet,
  persistBannerWallet,
  subscribeProfilesToStorage,
  subscribeProfilesToUpdates,
} from '~/stores/banner-store'
import { toolState, toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import { commitSession, getSession } from '~/utils/session.server.js'

export const meta: MetaFunction = () => {
  return [
    { title: 'Banner - Publisher Tools' },
    {
      name: 'description',
      content:
        'Create and customize a Web Monetization banner for your website. The banner informs visitors about Web Monetization and provides a call-to-action for extension installation.',
    },
  ]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare
  const session = await getSession(request.headers.get('Cookie'))
  const grantResponse = session.get('grant-response')
  const isGrantAccepted = session.get('is-grant-accepted')
  const isGrantResponse = session.get('is-grant-response')

  session.unset('grant-response')
  session.unset('is-grant-accepted')
  session.unset('is-grant-response')

  return data(
    {
      grantResponse,
      isGrantAccepted,
      isGrantResponse,
      OP_WALLET_ADDRESS: env.OP_WALLET_ADDRESS,
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    },
  )
}

export default function Banner() {
  const snap = useSnapshot(toolState)
  const bannerSnap = useSnapshot(banner)
  const uiActions = useUIActions()

  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()

  useEffect(() => {
    uiActions.setActiveSection('content')
  }, [OP_WALLET_ADDRESS])

  return (
    <ToolLayoutWithPreview
      title="Banner"
      description={
        <>
          The drawer banner informs visitors who don&apos;t have the Web
          Monetization extension active, with a call-to-action linking to the
          extension or providing details about the options available.
          <br />
          It also adds your wallet address for your site to be monetized.
        </>
      }
      walletStore={{
        wallet: bannerWallet,
        actions: bannerWalletActions,
        load: loadBannerWallet,
        persist: persistBannerWallet,
      }}
      toolStoreUtils={{
        subscribeProfilesToStorage,
        hydrateProfilesFromStorage,
        hydrateSnapshotsFromStorage,
        subscribeProfilesToUpdates,
      }}
      walletAddressToolName="drawer banner"
      steps={[{ number: 2, label: 'Build', status: snap.buildStep }]}
      preview={<BannerPreview />}
      loaderData={{
        grantResponse,
        isGrantAccepted,
        isGrantResponse,
        OP_WALLET_ADDRESS,
      }}
    >
      <BuilderProfileTabs
        idPrefix="profile"
        options={bannerSnap.profileTabs}
        selectedId={snap.activeTab}
        onChange={(profileId) => toolActions.setActiveTab(profileId)}
        onRename={(name) => actions.setProfileName(name)}
      >
        <BannerBuilder
          onRefresh={(section) => actions.resetProfileSection(section)}
        />
      </BuilderProfileTabs>
    </ToolLayoutWithPreview>
  )
}
