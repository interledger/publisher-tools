import type { Tool } from '@shared/types'

type ProfileSavedEvent = `${Tool}_profile_saved`
type ScriptGeneratedEvent = `${Tool}_script_generated`

export type ToolsEventMap = {
  click_card_tool: { link: string }
  wallet_connected: { wallet_provider: string }
  wallet_disconnected: undefined
  link_tag_generated: { wallet_provider: string }
} & {
  [K in ProfileSavedEvent | ScriptGeneratedEvent]: undefined
}
