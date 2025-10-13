import {
  json,
  type ActionFunctionArgs,
  type MetaFunction
} from '@remix-run/cloudflare'
import { useEffect, useRef } from 'react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Grant Interaction' },
    { name: 'description', content: 'Interaction success' }
  ]
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { env } = context.cloudflare
  const body = (await request.json()) as { data: object; paymentId: string }
  const { data, paymentId } = body

  try {
    const existingData = await env.PUBLISHER_TOOLS_KV.get(paymentId)

    if (existingData) {
      return json({ success: true, message: 'Already stored' })
    }

    await env.PUBLISHER_TOOLS_KV.put(paymentId, JSON.stringify(data), {
      expirationTtl: 300 // 5min,
    })

    return json({ success: true })
  } catch {
    return json(
      { success: false, error: 'Failed to store data' },
      { status: 500 }
    )
  }
}

export default function PaymentComplete() {
  const hasPostedMessage = useRef(false)

  useEffect(() => {
    if (hasPostedMessage.current) return

    const params: { [key: string]: string } = {}
    new URLSearchParams(window.location.search).forEach((value, key) => {
      params[key] = value
    })

    if (!hasPostedMessage.current) {
      hasPostedMessage.current = true
      if (window.opener) {
        window.opener.postMessage({ type: 'GRANT_INTERACTION', ...params }, '*')
      } else {
        fetch('/tools/payment-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: params,
            paymentId: params.paymentId
          })
        })
      }
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
