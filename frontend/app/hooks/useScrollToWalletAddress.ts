import { useCallback, useRef } from 'react'
import { useUIActions } from '~/stores/uiStore'

export function useScrollToWalletAddress() {
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const uiActions = useUIActions()

  const scrollToWalletAddress = useCallback(() => {
    if (!walletAddressRef.current) {
      return
    }

    requestAnimationFrame(() => {
      if (!walletAddressRef.current) return

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      walletAddressRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
        block: 'center',
        inline: 'nearest',
      })

      if (!prefersReducedMotion) {
        walletAddressRef.current.style.transition = 'all 0.6s ease'
        walletAddressRef.current.style.transform = 'scale(1.025)'

        setTimeout(() => {
          if (walletAddressRef.current) {
            walletAddressRef.current.style.transform = 'scale(1)'
          }
        }, 500)
      }

      setTimeout(
        () => {
          // delay focus until after the scroll animation finishes to avoid
          // a layout shift mid-scroll that would cancel the smooth animation.
          uiActions.focusWalletInput()
        },
        prefersReducedMotion ? 0 : 700,
      )
    })
  }, [])

  return { walletAddressRef, scrollToWalletAddress }
}
