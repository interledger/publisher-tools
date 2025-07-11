import { useState } from 'react'
import { cx } from 'class-variance-authority'
import { Heading5 } from '../Typography'
import { InputField, ToolsPrimaryButton } from './index'
import { SVGCopyIcon } from '~/assets/svg'

export const LinkTagGenerator = () => {
  const [pointerInput, setPointerInput] = useState('')
  const [linkTag, setParsedLinkTag] = useState('')
  const [invalidUrl, setInvalidUrl] = useState(false)
  const [showCodeBox, setShowCodeBox] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Function to validate and format the payment pointer URL
  const isValidPointer = (input: string) => {
    try {
      let urlString = input.trim()
      if (input.charAt(0) === '$') {
        urlString = input.replace('$', 'https://')
      }

      const url = new URL(urlString)

      if (url.pathname === '/') {
        return `${url.origin}.well-known/pay`
      }

      return url.href
    } catch (err) {
      setInvalidUrl(true)
    }
  }

  // Just in case the pointer contains special characters
  const parsePointer = (pointer: string) => {
    return pointer
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(
        `<link rel="monetization" href="${linkTag}" />`
      )
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInvalidUrl(false)
    setIsCopied(false)

    const validatedPointer = isValidPointer(pointerInput)

    if (validatedPointer) {
      setParsedLinkTag(parsePointer(validatedPointer))
      setShowCodeBox(true)
    } else {
      setShowCodeBox(false)
    }
  }

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPointerInput(e.target.value)
    setInvalidUrl(false)
    setShowCodeBox(false)
  }

  return (
    <div className="flex w-full max-w-[800px] p-md flex-col gap-md rounded-sm bg-interface-bg-container">
      {/* Generator Header */}
      <div>
        <Heading5>Link tag generator</Heading5>
      </div>
      {/* Input Field */}
      <div>
        <label
          htmlFor="paymentPointer"
          className={cx(
            'text-field-helpertext-default font-sans text-xs font-normal leading-xs',
            invalidUrl && 'text-text-error'
          )}
        >
          Your payment pointer
        </label>
        <InputField
          id="paymentPointer"
          placeholder="Fill in your payment pointer/wallet address"
          value={pointerInput}
          onChange={(e) => handleOnChange(e)}
          error={
            invalidUrl
              ? 'The payment pointer you have entered is not valid or cannot be found'
              : ''
          }
        />
        {!invalidUrl && (
          <p className="text-xs text-text-secondary mt-1 sm:hidden">
            Fill in your payment pointer/wallet address
          </p>
        )}
      </div>

      {showCodeBox && linkTag && (
        <div className="flex min-h-[40px] p-sm justify-between items-center rounded-sm bg-interface-bg-main">
          <div className="grow shrink font-sans text-sm font-normal leading-normal whitespace-pre-wrap min-w-0 overflow-x-auto">
            <span>&lt;</span>
            <span className="text-[#00009F]">link </span>
            <span className="text-[#00A4DB]">rel</span>
            <span>=&quot;</span>
            <span className="text-[#E3116C]">monetization</span>
            <span>&quot; </span>
            <span className="text-[#00A4DB]">href</span>
            <span>=&quot;</span>
            <span className="text-[#E3116C]">{linkTag}</span>
            <span>&quot; /&gt;</span>
          </div>
          <button
            onClick={handleCopyClick}
            aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
          >
            <SVGCopyIcon />
          </button>
        </div>
      )}

      <ToolsPrimaryButton
        icon="link"
        className="justify-center"
        type="submit"
        onClick={(e) => handleSubmit(e)}
      >
        Generate link-tag
      </ToolsPrimaryButton>

      {isCopied && (
        <div className="h-[40px] p-sm rounded-sm bg-interface-bg-main">
          <p className="font-sans text-sm font-normal leading-normal text-text-success text-center">
            Copied to clipboard.
          </p>
        </div>
      )}
    </div>
  )
}
