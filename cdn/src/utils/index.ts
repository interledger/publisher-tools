import type { ElementConfigType } from '@shared/types'

type Tool = 'banner' | 'widget'

type PickByPrefix<T, P> = Pick<T, Extract<keyof T, P>>
export type BannerConfig = PickByPrefix<ElementConfigType, `banner${string}`>
export type WidgetConfig = PickByPrefix<ElementConfigType, `widget${string}`>

type Config<T extends Tool> = {
  banner: BannerConfig
  widget: WidgetConfig
}[T]

export function getScriptParams(tool: Tool) {
  const script = document.querySelector<HTMLScriptElement>(
    `script#wmt-${tool}-init-script`
  )
  if (!script) {
    throw new Error(`Could not find ${tool}.js script element.`)
  }
  const cdnUrl = new URL(script.src).origin

  const { walletAddress, walletAddressId, tag } = script.dataset

  if (!walletAddress) {
    throw new Error(`Missing data-wallet-address for ${tool}.js script`)
  }
  try {
    void new URL(walletAddress)
  } catch {
    throw new Error(
      `Invalid data-wallet-address for ${tool}.js script: ${walletAddress}`
    )
  }
  if (walletAddressId) {
    try {
      void new URL(walletAddressId)
    } catch {
      throw new Error(
        `Invalid data-wallet-address-id for ${tool}.js script: ${walletAddressId}`
      )
    }
  }

  if (!tag) {
    throw new Error(`Missing data-tag for ${tool}.js script`)
  }

  return { walletAddress, walletAddressId, presetId: tag, cdnUrl }
}

export async function fetchConfig<T extends Tool>(
  apiUrl: string,
  tool: T,
  params: ReturnType<typeof getScriptParams>
): Promise<Config<T>> {
  const walletAddress = params.walletAddressId || params.walletAddress
  const urlWallet = encodeURIComponent(walletAddress.replace('https://', ''))
  const url = new URL(`config/${urlWallet}/${params.presetId}`, apiUrl)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `Failed to fetch config: HTTP ${res.status} ${res.statusText}`
    )
  }

  const json = await res.json()
  return json as Config<T>
}

export function appendPaymentPointer(walletAddressUrl: string) {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
}
