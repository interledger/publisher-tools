import { useState } from 'react'
import { cx } from 'class-variance-authority'
import { Heading5 } from '../Typography'
import { InputField, Tooltip, ToolsPrimaryButton } from './index'
import { Highlight, themes } from 'prism-react-renderer'
import { SVGCopyScript } from '~/assets/svg'

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
      setTimeout(() => setIsCopied(false), 1500)
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
    <div className="flex w-[800px] p-md flex-col gap-md rounded-sm bg-interface-bg-container">
      {/* Generator Header */}
      <div className="flex items-center gap-xs">
        <Heading5>Generator</Heading5>
        <Tooltip>Generate link tag</Tooltip>
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
          placeholder="Fill in your wallet address"
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
        <div className="flex h-[40px] p-sm justify-between items-center rounded-sm bg-interface-bg-main">
          <Highlight
            theme={themes.github}
            code={generatedLinkTag}
            language="tsx"
          >
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={'font-sans text-sm font-normal leading-normal'}
                style={style}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <mask
                id="mask0_3439_8007"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
              >
                <rect width="24" height="24" fill="#C4C4C4" />
              </mask>
              <g mask="url(#mask0_3439_8007)">
                <path
                  d="M9 18C8.45 18 7.97933 17.8043 7.588 17.413C7.196 17.021 7 16.55 7 16V4C7 3.45 7.196 2.979 7.588 2.587C7.97933 2.19567 8.45 2 9 2H18C18.55 2 19.021 2.19567 19.413 2.587C19.8043 2.979 20 3.45 20 4V16C20 16.55 19.8043 17.021 19.413 17.413C19.021 17.8043 18.55 18 18 18H9ZM9 16H18V4H9V16ZM5 22C4.45 22 3.979 21.8043 3.587 21.413C3.19567 21.021 3 20.55 3 20V6H5V20H16V22H5Z"
                  fill="#000000"
                />
              </g>
            </svg>
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
    </div>
  )
}
