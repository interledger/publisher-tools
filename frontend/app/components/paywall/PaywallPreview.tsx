import { usePaywallProfile } from '~/stores/paywall-store'

export function PaywallPreview() {
  const [profile] = usePaywallProfile()

  return <pre className="overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
}
