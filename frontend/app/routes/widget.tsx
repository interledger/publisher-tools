import { useEffect } from 'react'
import {
  useLoaderData,
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { BuilderProfileTabs } from '@/components'
import { ToolLayoutWithPreview } from '~/components/ToolLayoutWithPreview'
import { WidgetBuilder } from '~/components/widget/WidgetBuilder'
import { WidgetPreview } from '~/components/widget/WidgetPreview'
import { toolState, toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import {
  actions,
  widget,
  hydrateProfilesFromStorage,
  hydrateSnapshotsFromStorage,
  loadWidgetWallet,
  persistWidgetWallet,
  subscribeProfilesToStorage,
  subscribeProfilesToUpdates,
  widgetWallet,
  widgetWalletActions,
} from '~/stores/widget-store'
import { commitSession, getSession } from '~/utils/session.server.js'

export const meta: MetaFunction = () => {
  return [
    { title: 'Widget - Publisher Tools' },
    {
      name: 'description',
      content:
        'Create and customize a Web Monetization payment widget for your website. The widget allows visitors to make one-time payments to support your content.',
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

export default function Widget() {
  const snap = useSnapshot(toolState)
  const widgetSnap = useSnapshot(widget)
  const uiActions = useUIActions()

  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()

  useEffect(() => {
    uiActions.setActiveSection('content')
  }, [OP_WALLET_ADDRESS])

  return (
    <ToolLayoutWithPreview
      title="Widget"
      description={
        <>
          The payment widget allows visitors to make one-time payments to
          support your content directly.
          <br />
          It provides a clean, customizable interface for Web Monetization
          payments.
          <br />
          Configure your wallet address to receive payments from your
          supporters.
        </>
      }
      walletStore={{
        wallet: widgetWallet,
        actions: widgetWalletActions,
        load: loadWidgetWallet,
        persist: persistWidgetWallet,
      }}
      toolStoreUtils={{
        subscribeProfilesToStorage,
        hydrateProfilesFromStorage,
        hydrateSnapshotsFromStorage,
        subscribeProfilesToUpdates,
      }}
      walletAddressToolName="payment widget"
      steps={[{ number: 2, label: 'Build', status: snap.buildStep }]}
      preview={<WidgetPreview />}
      loaderData={{
        grantResponse,
        isGrantAccepted,
        isGrantResponse,
        OP_WALLET_ADDRESS,
      }}
    >
      <BuilderProfileTabs
        idPrefix="profile"
        options={widgetSnap.profileTabs}
        selectedId={snap.activeTab}
        onChange={(profileId) => toolActions.setActiveTab(profileId)}
        onRename={(name) => actions.setProfileName(name)}
      >
        <WidgetBuilder
          onRefresh={(section) => actions.resetProfileSection(section)}
        />
      </BuilderProfileTabs>
    </ToolLayoutWithPreview>
  )
}
