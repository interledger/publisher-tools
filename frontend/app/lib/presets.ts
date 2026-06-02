import { TOOL_BANNER, TOOL_PAYWALL, TOOL_WIDGET } from '@shared/types'
import type { Tool } from '@shared/types'

export const SUGGESTED_TITLES: Partial<Record<Tool, readonly string[]>> = {
  [TOOL_BANNER]: [
    'How to support?',
    'Fund me',
    'Pay as you browse',
    'Easy donate',
    'Support my work',
  ],
  [TOOL_WIDGET]: [
    'Support this content',
    'Make a payment',
    'Contribute now',
    'Help support',
    'One-time donation',
  ],
  [TOOL_PAYWALL]: [
    'Finish reading this story',
    'Keep reading',
    'Unlock full article',
    'Support this piece',
  ],
}

export const ALL_SUGGESTED_TITLES = new Set<string>(
  Object.values(SUGGESTED_TITLES).flat(),
)
