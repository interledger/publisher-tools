import type { ComponentType, SVGProps } from 'react'
import { useSearchParams, type MetaFunction } from 'react-router'
import { CheckCircleSolid, XCircleSolid } from '~/components/icons'

export const meta: MetaFunction = () => {
  return [
    { title: 'Grant Interaction' },
    { name: 'description', content: 'Grant interaction result' },
  ]
}

const InfoCircleSolid = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm9-4.5a.75.75 0 001.5 0 .75.75 0 00-1.5 0zm0 3.75a.75.75 0 011.5 0v5.25a.75.75 0 01-1.5 0V11.25z"
        clipRule="evenodd"
      />
    </svg>
  )
}

type View = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  iconColor: string
  title: string
  message: string
}

const SUCCESS_VIEW: View = {
  Icon: CheckCircleSolid,
  iconColor: 'text-green-600',
  title: 'Payment authorized',
  message: 'Your payment is being processed.\nYou can now close this window.',
}

const FAILURE_VIEW: View = {
  Icon: XCircleSolid,
  iconColor: 'text-red-600',
  title: 'Payment not authorized',
  message:
    'The payment was declined or could not be completed.\nYou can now close this window.',
}

const UNKNOWN_VIEW: View = {
  Icon: InfoCircleSolid,
  iconColor: 'text-gray-500',
  title: 'Interaction complete',
  message: 'You can now close this window.',
}

export default function GrantInteraction() {
  const [searchParams] = useSearchParams()
  const result = searchParams.get('result')

  const view =
    result === 'success'
      ? SUCCESS_VIEW
      : result === 'failure'
        ? FAILURE_VIEW
        : UNKNOWN_VIEW

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center">
        <view.Icon className={`mx-auto h-24 w-24 mb-6 ${view.iconColor}`} />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{view.title}</h2>
        <p className="text-gray-600 whitespace-pre-line">{view.message}</p>
      </div>
    </div>
  )
}
