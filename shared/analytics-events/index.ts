export const TOOLS_EVENTS = {
  VIEW_MAIN_PAGE: 'tools_view_main_page',
  CLICK_CARD_TOOL: 'tools_click_card_tool',
  PROFILE_SAVED: 'tools_profile_saved',
  SCRIPT_GENERATED: 'tools_script_generated',
  WALLET_CONNECTED: 'tools_wallet_connected',
  WALLET_DISCONNECTED: 'tools_wallet_disconnected',
  SETTINGS_CHANGED: 'tools_settings_changed',
  GENERATED_TAG: 'tools_generated_tag',
} as const

export const EMBED_EVENTS = {
  CLICK_LINK_BANNER: 'embed_click_link_banner',
  CLICK_LINK_OFFERWALL: 'embed_click_link_offerwall',
  RENDER_TOOL: 'embed_render_tool',
} as const

export const API_EVENTS = {
  FINALIZED_PAYMENT: 'api_finalized_payment',
} as const

export type ToolsEventName = (typeof TOOLS_EVENTS)[keyof typeof TOOLS_EVENTS]
export type EmbedEventName = (typeof EMBED_EVENTS)[keyof typeof EMBED_EVENTS]
export type ApiEventName = (typeof API_EVENTS)[keyof typeof API_EVENTS]
export type AnalyticsEventName = ToolsEventName | EmbedEventName | ApiEventName
