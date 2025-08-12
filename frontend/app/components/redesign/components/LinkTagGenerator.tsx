import { useState, useCallback } from 'react'
import { InputField, ToolsPrimaryButton, CodeBlock } from '@/components'
import { Heading5 } from '@/typography'
import { SVGCopyIcon, SVGCheckIcon } from '@/assets'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import {
  validateWalletAddressOrPointer,
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
  const [pointerInput, setPointerInput] = useState('')
  const [linkTag, setParsedLinkTag] = useState('')
  const [invalidUrl, setInvalidUrl] = useState(false)
  const [error, setError] = useState('')
  const [showCodeBox, setShowCodeBox] = useState(false)
  const { isCopied, handleCopyClick } = useCopyToClipboard(
    `<link rel="monetization" href="${linkTag}" />`
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setInvalidUrl(false)
      setError('')

      setParsedLinkTag(htmlEncodePointer(pointerInput))

      try {
        await validateWalletAddressOrPointer(pointerInput)
        setShowCodeBox(true)

        setError('')
        setInvalidUrl(false)
      } catch (err) {
        const message =
          err instanceof WalletAddressFormatError
            ? err.message
            : 'Invalid wallet address'
        setInvalidUrl(true)
        setError(message)
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
          label="Your payment pointer"
          required
          placeholder="Fill in your payment pointer/wallet address"
          value={pointerInput}
          onChange={(e) => handleOnChange(e)}
          error={invalidUrl ? error : ''}
        />
      </div>

      {showCodeBox && linkTag && (
        <div className="flex h-[40px] p-sm justify-between items-center rounded-sm bg-interface-bg-main">
          <CodeBlock
            link={linkTag}
            className="flex-1 text-sm leading-normal whitespace-nowrap min-w-0 overflow-x-auto"
          />
          <button
            onClick={handleCopyClick}
            aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
          >
            {isCopied ? (
              <SVGCheckIcon className="w-6 h-6" />
            ) : (
              <SVGCopyIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      )}

      <ToolsPrimaryButton icon="link" className="justify-center" type="submit">
        Generate Link Tag
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
