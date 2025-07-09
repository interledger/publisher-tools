import { useState } from 'react'
import { cx } from 'class-variance-authority'
import { Heading5 } from '../Typography'
import { InputField, Tooltip, ToolsPrimaryButton } from './index'
import { Highlight, themes } from 'prism-react-renderer'
import { SVGCopyIcon } from '~/assets/svg'

export const SuccessPopUp = () => {
  const [pointerInput, setPointerInput] = useState('')
  const [generatedLinkTag, setGeneratedLinkTag] = useState('')
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
      // Do we want to log this error?
      setInvalidUrl(true)
      return ''
    }
  }

  // Function to generate the HTML link tag
  const generateHtmlLinkTag = (pointer: string) => {
    const escapedPointer = pointer
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
    return `<link rel="monetization" href="${escapedPointer}" />`
  }

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(generatedLinkTag)
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
      setGeneratedLinkTag(generateHtmlLinkTag(validatedPointer))
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
      </div>

      {showCodeBox && generatedLinkTag && (
        <div className="flex min-h-[40px] p-sm justify-between items-center rounded-sm bg-interface-bg-main">
          {/* May not need to use Highlight component here, but it provides syntax highlighting */}
          <Highlight
            theme={themes.github}
            code={generatedLinkTag}
            language="html"
          >
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={
                  'grow shrink basis-0 font-sans text-sm font-normal leading-normal whitespace-pre-wrap'
                }
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
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
