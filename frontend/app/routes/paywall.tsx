import { useEffect } from 'react'
import {
  data,
  useLoaderData,
  type MetaFunction,
  type LoaderFunctionArgs,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { PaywallBuilder } from '~/components/paywall/PaywallBuilder'
import { PaywallBuilderSettings } from '~/components/paywall/PaywallBuilderSettings'
import { PaywallPreview } from '~/components/paywall/PaywallPreview'
import { Divider } from '~/components/redesign/components'
import { ToolLayoutWithPreview } from '~/components/ToolLayoutWithPreview'
import { useToolWallet } from '~/hooks/useToolWallet'
import { useTranslation } from '~/i18n/useTranslation'
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
import { toolState } from '~/stores/toolStore'
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

  useEffect(() => {
    paywall.profile.price.currency =
      walletSnap.walletAddressInfo?.assetCode || 'USD'
  }, [walletSnap.walletAddressInfo])

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
      additionalDescription={<Divider className="!my-3xl" />}
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
      walletAddressToolName="pay per article"
      steps={[
        { number: 2, label: 'Configure', status: snap.configureStep },
        { number: 3, label: 'Build', status: snap.buildStep },
      ]}
      preview={<PaywallPreview />}
      loaderData={{
        grantResponse,
        isGrantAccepted,
        isGrantResponse,
        OP_WALLET_ADDRESS,
      }}
      hasUnsavedChanges={paywallSnap.profilesUpdate.has(snap.activeTab)}
      stepMiddle={<PaywallBuilderSettings />}
    >
      <div className="bg-interface-bg-container rounded-sm p-md flex-col gap-md w-full -mt-2 flex">
        <PaywallBuilder
          onRefresh={(section) => actions.resetProfileSection(section)}
        />
      </div>
    </ToolLayoutWithPreview>
  )
}
