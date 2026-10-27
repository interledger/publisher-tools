import { useState, useEffect, useCallback, useEffectEvent } from 'react'

export const useCopyToClipboard = (
  text: string,
  callback?: (copied: boolean) => void,
) => {
  const [isCopied, setIsCopied] = useState(false)
  // callers may pass a new callback on each render; don't restart the timer
  const onCopiedChange = useEffectEvent((copied: boolean) => {
    callback?.(copied)
  })

  useEffect(() => {
    if (isCopied) {
      onCopiedChange(isCopied)
      const timer = setTimeout(() => {
        setIsCopied(false)
        onCopiedChange(!isCopied)
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
