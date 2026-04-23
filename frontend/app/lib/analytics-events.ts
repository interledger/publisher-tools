import type { Tool } from '@shared/types'

export type ToolsEventMap = {
  click_card_tool: { link: string }
  wallet_connected: { wallet_provider: string }
  wallet_disconnected: undefined
  profile_saved: { tool: Tool }
  script_generated: { tool: Tool }
  generated_tag: { tag_type: 'link_tag'; wallet_provider: string }
}
