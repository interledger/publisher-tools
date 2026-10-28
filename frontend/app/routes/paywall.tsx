import { useEffect } from 'react'
import {
  data,
  useLoaderData,
  type MetaFunction,
  type LoaderFunctionArgs,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { BuilderProfileTabs } from '~/components/BuilderProfileTabs'
import { Divider } from '~/components/Divider'
import { PaywallBuilder } from '~/components/paywall/PaywallBuilder'
import { PaywallBuilderSettings } from '~/components/paywall/PaywallBuilderSettings'
import { PaywallPreview } from '~/components/paywall/PaywallPreview'
import { ToolLayoutWithPreview } from '~/components/ToolLayoutWithPreview'
import { useToolWallet } from '~/hooks/useToolWallet'
import { useTranslation } from '~/i18n/useTranslation'
import { cloudflareContext } from '~/lib/context.js'
import {
  actions,
  hydrateProfilesFromStorage,
  hydrateSnapshotsFromStorage,
  loadPaywallWallet,
  paywall,
  paywallWallet,
  paywallWalletActions,
  persistPaywallWallet,
  subscribeProfilesToStorage,
  subscribeProfilesToUpdates,
} from '~/stores/paywall-store'
import { toolActions, toolState } from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Pay Per Article - Publisher Tools' },
    {
      name: 'description',
      content: `Pay Per Article lets visitors unlock gated content with a one-time payment.`,
    },
  ]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { env } = context.get(cloudflareContext)
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

export default function Paywall() {
  const t = useTranslation('paywall')
  const snap = useSnapshot(toolState)
  const paywallSnap = useSnapshot(paywall)
  const [walletSnap] = useToolWallet({
    wallet: paywallWallet,
    actions: paywallWalletActions,
  })
  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()

  // Each version has its own price, so the version being edited takes the
  // wallet's currency when either of them changes.
  useEffect(() => {
    paywall.profiles[snap.activeTab].price.currency =
      walletSnap.walletAddressInfo?.assetCode || 'USD'
  }, [walletSnap.walletAddressInfo, snap.activeTab])

  return (
    <ToolLayoutWithPreview
      title={t('title')}
      description={
        <>
          {t('description_1')}
          <br />
          {t('description_2')}
        </>
      }
      additionalDescription={<Divider className="my-3xl!" />}
      walletStore={{
        wallet: paywallWallet,
        actions: paywallWalletActions,
        load: loadPaywallWallet,
        persist: persistPaywallWallet,
      }}
      toolStoreUtils={{
        subscribeProfilesToStorage,
        hydrateProfilesFromStorage,
        hydrateSnapshotsFromStorage,
        subscribeProfilesToUpdates,
      }}
      tool="paywall"
      steps={[{ number: 2, label: 'Build', status: snap.buildStep }]}
      preview={<PaywallPreview />}
      loaderData={{
        grantResponse,
        isGrantAccepted,
        isGrantResponse,
        OP_WALLET_ADDRESS,
      }}
      hasUnsavedChanges={paywallSnap.profilesUpdate.has(snap.activeTab)}
    >
      <BuilderProfileTabs
        idPrefix="profile"
        options={paywallSnap.profileTabs}
        selectedId={snap.activeTab}
        onChange={(profileId) => toolActions.setActiveTab(profileId)}
        onRename={(name) => actions.setProfileName(name)}
      >
        <PaywallBuilderSettings />
        <PaywallBuilder
          onRefresh={(section) => actions.resetProfileSection(section)}
        />
      </BuilderProfileTabs>
    </ToolLayoutWithPreview>
  )
}
