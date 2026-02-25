import { useCallback, useRef } from 'react'

export function useScrollToWalletAddress() {
  const walletAddressRef = useRef<HTMLDivElement>(null)

  const scrollToWalletAddress = useCallback(() => {
    if (!walletAddressRef.current) {
      return
    }

    requestAnimationFrame(() => {
      if (!walletAddressRef.current) return

      walletAddressRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })

      walletAddressRef.current.style.transition = 'all 0.6s ease'
      walletAddressRef.current.style.transform = 'scale(1.025)'

      setTimeout(() => {
        if (walletAddressRef.current) {
          walletAddressRef.current.style.transform = 'scale(1)'
        }
      }, 500)
    })
  }, [])

  return { walletAddressRef, scrollToWalletAddress }
}
