import { useState, useEffect, useCallback } from 'react'

export const useCopyToClipboard = (text: string) => {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopyClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }, [text])

  return { isCopied, handleCopyClick }
}
