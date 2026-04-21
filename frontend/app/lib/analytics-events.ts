import type { Tool } from '@shared/types'

export type ToolsEventMap = {
  tools_click_card_tool: { link: string }
  tools_wallet_connected: { wallet_provider: string }
  tools_wallet_disconnected: undefined
  tools_profile_saved: { tool: Tool }
  tools_script_generated: { tool: Tool }
  tools_settings_changed: { tool: Tool }
  tools_generated_tag: { tag_type: 'link_tag' | 'revshare' }
}
