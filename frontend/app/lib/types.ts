import type { Tool, ToolProfiles } from '@shared/types'

export type GrantOutcome =
  | 'success'
  | 'declined'
  | 'sessionExpired'
  | 'verificationFailed'

export type SaveResult = {
  success?: boolean
  grantRedirect?: string
  error?: {
    message: string
    cause?: {
      message: string
      errors: Record<string, string>
    }
  }
}

export type GetProfilesResult<T extends Tool> = {
  profiles?: ToolProfiles<T>
  error?: {
    message: string
    cause?: {
      message: string
      errors: Record<string, string>
    }
  }
}

declare global {
  interface Window {
    umami?: {
      track(eventName: string, eventData?: Record<string, unknown>): void
    }
  }

  interface Env {
    OP_KEY_ID: string
    OP_PRIVATE_KEY: string
    OP_WALLET_ADDRESS: string

    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string
    AWS_S3_ENDPOINT: string

    PUBLISHER_TOOLS_KV: KVNamespace
  }
}
