import { useState, useEffect, useCallback } from 'react'

export const useCopyToClipboard = (
  text: string,
  callback?: (copied: boolean) => void
) => {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      callback?.(isCopied)
      const timer = setTimeout(() => {
        setIsCopied(false)
        callback?.(!isCopied)
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
