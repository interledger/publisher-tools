import type { Tool, PresetId, ToolConfig } from '@shared/types'

export function getScriptParams(tool: Tool) {
  const script = document.querySelector<HTMLScriptElement>(
    `script#wmt-${tool}-init-script`
  )
  if (!script) {
    throw new Error(`Could not find ${tool}.js script element.`)
  }

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

  return { walletAddress, walletAddressId, presetId: tag as PresetId }
}

export async function fetchConfig<T extends Tool>(
  apiUrl: string,
  tool: T,
  params: ReturnType<typeof getScriptParams>
): Promise<ToolConfig<T>> {
  const url = new URL(`config/${tool}`, apiUrl)
  url.searchParams.set('wa', params.walletAddressId || params.walletAddress)
  url.searchParams.set('preset', params.presetId)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `Failed to fetch config: HTTP ${res.status} ${res.statusText}`
    )
  }

  const json = await res.json()
  return json as ToolConfig<T>
}

export function appendPaymentPointer(walletAddressUrl: string) {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
}
