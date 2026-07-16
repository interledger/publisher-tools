export const BANNER_SUGGESTED_TITLES = [
  'How to support?',
  'Fund me',
  'Pay as you browse',
  'Easy donate',
  'Support my work',
] as const

export const WIDGET_SUGGESTED_TITLES = [
  'Support this content',
  'Make a payment',
  'Contribute now',
  'Help support',
  'One-time donation',
] as const

export const PAYWALL_SUGGESTED_TITLES = [
  'Finish reading this story',
  'Keep reading',
  'Unlock full article',
  'Support this piece',
] as const

export const ALL_SUGGESTED_TITLES = new Set<string>([
  ...BANNER_SUGGESTED_TITLES,
  ...WIDGET_SUGGESTED_TITLES,
  ...PAYWALL_SUGGESTED_TITLES,
])
