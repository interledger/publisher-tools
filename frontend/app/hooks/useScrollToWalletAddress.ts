import { useCallback, useRef } from 'react'

export function useScrollToWalletAddress() {
  const walletAddressRef = useRef<HTMLDivElement>(null)

  const scrollToWalletAddress = useCallback(() => {
    if (!walletAddressRef.current) {
      return
    }
    walletAddressRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    })

    walletAddressRef.current.style.transition = 'all 0.3s ease'
    walletAddressRef.current.style.transform = 'scale(1.02)'

    setTimeout(() => {
      if (walletAddressRef.current) {
        walletAddressRef.current.style.transform = 'scale(1)'
      }
    }, 500)
  }, [])

  return { walletAddressRef, scrollToWalletAddress }
}
