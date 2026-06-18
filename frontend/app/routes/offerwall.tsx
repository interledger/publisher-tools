import {
  data,
  useLoaderData,
  type MetaFunction,
  type LoaderFunctionArgs,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { BuilderBackground, BuilderProfileTabs, Divider } from '@/components'
import HowItWorks from '~/components/offerwall/HowItWorks'
import { OfferwallBuilder } from '~/components/offerwall/OfferwallBuilder'
import OfferwallPreview from '~/components/offerwall/OfferwallPreview'
import { ToolLayoutWithPreview } from '~/components/ToolLayoutWithPreview'
import {
  actions,
  hydrateProfilesFromStorage,
  hydrateSnapshotsFromStorage,
  loadOfferwallWallet,
  offerwall,
  offerwallWallet,
  offerwallWalletActions,
  persistOfferwallWallet,
  subscribeProfilesToStorage,
  subscribeProfilesToUpdates,
} from '~/stores/offerwall-store'
import { toolActions, toolState } from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Offerwall - Publisher Tools' },
    {
      name: 'description',
      content:
        "Help your users who don't have Web Monetization enabled discover it and support your content.",
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

export default function Offerwall() {
  const snap = useSnapshot(toolState)
  const offerwallSnap = useSnapshot(offerwall)

  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()

  return (
    <ToolLayoutWithPreview
      title="Offerwall experience"
      description={
        <>
          The Offerwall experience helps visitors who don’t yet have Web
          Monetization enabled discover it and support your content.
        </>
      }
      additionalDescription={
        <>
          <HowItWorks />
          <Divider className="!my-3xl" />
        </>
      }
      walletStore={{
        wallet: offerwallWallet,
        actions: offerwallWalletActions,
        load: loadOfferwallWallet,
        persist: persistOfferwallWallet,
      }}
      toolStoreUtils={{
        subscribeProfilesToStorage,
        hydrateProfilesFromStorage,
        hydrateSnapshotsFromStorage,
        subscribeProfilesToUpdates,
      }}
      steps={[{ number: 2, label: 'Build', status: snap.buildStep }]}
      walletAddressToolName="offerwall experience"
      preview={<OfferwallPreview />}
      loaderData={{
        grantResponse,
        isGrantAccepted,
        isGrantResponse,
        OP_WALLET_ADDRESS,
      }}
    >
      <BuilderProfileTabs
        idPrefix="profile"
        options={offerwallSnap.profileTabs}
        selectedId={snap.activeTab}
        onChange={(profileId) => toolActions.setActiveTab(profileId)}
        onRename={(name) => actions.setProfileName(name)}
      >
        <OfferwallBuilder onRefresh={() => actions.resetProfileSection()} />
      </BuilderProfileTabs>
    </ToolLayoutWithPreview>
  )
}
