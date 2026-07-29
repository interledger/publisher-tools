import type { ComponentType, SVGProps } from 'react'
import { useSearchParams, type MetaFunction } from 'react-router'
import { SVGErrorVector, SVGMarkSuccess } from '@/assets'
import en from '~/i18n/locales/en.json'
import { useTranslation } from '~/i18n/useTranslation'

export const meta: MetaFunction = ({ location }) => {
  const params = new URLSearchParams(location.search)
  const result = params.get('result')
  const t = en.grantInteraction

  if (result === 'success') {
    return [
      { title: gi['payment.meta.successTitle'] },
      { name: 'description', content: gi['payment.meta.successDescription'] },
    ]
  }
  if (result === 'failure') {
    return [
      { title: gi['payment.meta.failureTitle'] },
      { name: 'description', content: gi['payment.meta.failureDescription'] },
    ]
  }
  return [
    { title: gi['payment.meta.defaultTitle'] },
    { name: 'description', content: gi['payment.meta.defaultDescription'] },
  ]
}

type View = {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { className: string }>
  title: string
  message: string
}

export default function GrantInteraction() {
  const [searchParams] = useSearchParams()
  const t = useTranslation('grantInteraction')
  const result = searchParams.get('result')

  const SUCCESS_VIEW: View = {
    Icon: SVGMarkSuccess,
    title: t('payment.success.title'),
    message: t('payment.success.message'),
  }

  const FAILURE_VIEW: View = {
    Icon: SVGErrorVector,
    title: t('payment.failure.title'),
    message: t('payment.failure.message'),
  }

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
