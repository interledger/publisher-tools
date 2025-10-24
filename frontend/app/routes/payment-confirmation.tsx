import {
  useLoaderData,
  type LoaderFunctionArgs,
  type MetaFunction
} from 'react-router'
import { useEffect, useRef } from 'react'
import { validatePaymentParams } from '~/utils/validate.server'
import { KV_PAYMENTS_PREFIX } from '@shared/types'

export const meta: MetaFunction = () => {
  return [
    { title: 'Grant Interaction' },
    { name: 'description', content: 'Interaction success' }
  ]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare
  const url = new URL(request.url)
  const params = Object.fromEntries([...url.searchParams])

  const validation = validatePaymentParams(params)
  if (!validation.success) {
    return Response.json({
      success: false,
      error: 'Invalid parameters',
      params
    })
  }

  const { paymentId } = validation.data

  try {
    const existingData = await env.PUBLISHER_TOOLS_KV.get(
      KV_PAYMENTS_PREFIX + paymentId
    )

    if (existingData) {
      // avoids spamming the KV store with redundant entries for the same payment
      return Response.json({ success: true, message: 'Already stored', params })
    }

    await env.PUBLISHER_TOOLS_KV.put(
      KV_PAYMENTS_PREFIX + paymentId,
      JSON.stringify(params),
      {
        expirationTtl: 300 // 5min
      }
    )

    return Response.json({ success: true, params })
  } catch {
    return Response.json(
      { success: false, error: 'Failed to store data', params },
      { status: 500 }
    )
  }
}

export default function PaymentComplete() {
  const { params } = useLoaderData<typeof loader>()
  const hasPostedMessage = useRef(false)

  useEffect(() => {
    if (hasPostedMessage.current) return

    hasPostedMessage.current = true
    if (window.opener) {
      window.opener.postMessage({ type: 'GRANT_INTERACTION', ...params }, '*')
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
