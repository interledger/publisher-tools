import type { MetaFunction } from 'react-router'
import { useEffect, useRef } from 'react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Grant Interaction' },
    { name: 'description', content: 'Interaction success' }
  ]
}

export default function PaymentComplete() {
  const hasPostedMessage = useRef(false)

  useEffect(() => {
    if (hasPostedMessage.current) return

    const params: { [key: string]: string } = {}
    new URLSearchParams(window.location.search).forEach((value, key) => {
      params[key] = value
    })

    //TODO: handle the case where window.opener is null
    if (window.opener && !hasPostedMessage.current) {
      window.opener.postMessage({ type: 'GRANT_INTERACTION', ...params }, '*')
      hasPostedMessage.current = true
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Complete!
          </h2>

          <p className="text-gray-600 mb-8">
            Your payment has been processed successfully. You can now close this
            window.
          </p>
        </div>
      </div>
    </div>
  )
}
