import { useState, useCallback } from 'react'
import { SVGSpinner } from '@/assets'
import { InputField, ToolsPrimaryButton, CodeBlockLink } from '@/components'
import { Heading5 } from '@/typography'
import {
  validateAndConfirmPointer,
  WalletAddressFormatError
} from '@shared/utils/index'

const htmlEncodePointer = (pointer: string): string => {
  return pointer
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const LinkTagGenerator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [pointerInput, setPointerInput] = useState('')
  const [linkTag, setParsedLinkTag] = useState('')
  const [invalidUrl, setInvalidUrl] = useState(false)
  const [error, setError] = useState('')
  const [showCodeBox, setShowCodeBox] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setInvalidUrl(false)
      setError('')

      try {
        const validatedPointer = await validateAndConfirmPointer(pointerInput)
        setParsedLinkTag(htmlEncodePointer(validatedPointer))
        setShowCodeBox(true)
      } catch (err) {
        const message =
          err instanceof WalletAddressFormatError
            ? err.message
            : 'invalid wallet address'
        setInvalidUrl(true)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [pointerInput]
  )

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPointerInput(e.target.value)
      setInvalidUrl(false)
      setShowCodeBox(false)
    },
    []
  )

  const handleCopyStatusChange = useCallback((copied: boolean) => {
    setIsCopied(copied)
  }, [])

  return (
    <form
      className="flex w-full max-w-[800px] p-md flex-col gap-md rounded-sm bg-interface-bg-container"
      onSubmit={handleSubmit}
    >
      <div>
        <Heading5>Link tag generator</Heading5>
      </div>
      <div>
        <InputField
          id="paymentPointer"
          label="Your payment pointer/wallet address"
          required
          placeholder="Fill in your payment pointer/wallet address"
          value={pointerInput}
          onChange={(e) => handleOnChange(e)}
          error={invalidUrl ? error : ''}
        />
      </div>

      {showCodeBox && linkTag && (
        <CodeBlockLink link={linkTag} onCopy={handleCopyStatusChange} />
      )}

      <ToolsPrimaryButton
        icon={!isLoading ? 'link' : undefined}
        className="justify-center"
        type="submit"
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading && <SVGSpinner className="w-4 h-4" />}
          <span>{isLoading ? 'Checking...' : 'Generate Link Tag'}</span>
        </div>
      </ToolsPrimaryButton>

      {isCopied && (
        <div className="h-[40px] p-sm rounded-sm bg-interface-bg-main">
          <p className="font-sans text-sm font-normal leading-normal text-text-success text-center">
            Copied to clipboard.
          </p>
        </div>
      )}
    </form>
  )
}
