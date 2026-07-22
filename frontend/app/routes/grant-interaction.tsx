import type { ComponentType, SVGProps } from 'react'
import { useSearchParams, type MetaFunction } from 'react-router'
import { SVGErrorVector, SVGMarkSuccess } from '@/assets'

export const meta: MetaFunction = () => {
  return [
    { title: 'Grant Interaction' },
    { name: 'description', content: 'Grant interaction result' },
  ]
}

type View = {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { className: string }>
  title: string
  message: string
}

const SUCCESS_VIEW: View = {
  Icon: SVGMarkSuccess,
  title: 'Payment Complete!',
  message:
    'Your payment has been processed successfully.\nYou can now close this window.',
}

const FAILURE_VIEW: View = {
  Icon: SVGErrorVector,
  title: 'Payment not authorized',
  message:
    'The payment was declined or could not be completed.\nYou can now close this window.',
}

export default function GrantInteraction() {
  const [searchParams] = useSearchParams()
  const result = searchParams.get('result')

  const view = result === 'failure' ? FAILURE_VIEW : SUCCESS_VIEW

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center">
        <view.Icon className="mx-auto h-24 w-24 mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{view.title}</h2>
        <p className="text-gray-600 whitespace-pre-line">{view.message}</p>
      </div>
    </div>
  )
}
