import type { ComponentType, SVGProps } from 'react'
import {
  useSearchParams,
  type LoaderFunctionArgs,
  type MetaFunction,
} from 'react-router'
import { SVGErrorVector, SVGMarkSuccess } from '@/assets'
import { useTranslation } from '~/i18n/useTranslation'
import { getInstance, getLocale } from '~/i18n/i18n.server.js'
import { i18nConfig } from '~/i18n/config.js'

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const result = url.searchParams.get('result')
  const i18n = getInstance(context)
  const locale = getLocale(context) ?? 'en'
  const t = i18n
    ? i18n.getFixedT(locale, 'paymentResult')
    : (key: string) => {
        const paymentResult = (i18nConfig.resources.en as any).paymentResult
        return paymentResult[key] ?? key
      }

  let title = t('meta.defaultTitle')
  let description = t('meta.defaultDescription')

  if (result === 'success') {
    title = t('meta.successTitle')
    description = t('meta.successDescription')
  } else if (result === 'failure') {
    title = t('meta.failureTitle')
    description = t('meta.failureDescription')
  }

  return {
    meta: {
      title,
      description,
    },
  }
}

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  return [
    { title: loaderData?.meta.title ?? 'Grant Interaction' },
    {
      name: 'description',
      content: loaderData?.meta.description ?? 'Grant interaction result',
    },
  ]
}

type View = {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { className: string }>
  title: string
  message: string
}

export default function GrantInteraction() {
  const [searchParams] = useSearchParams()
  const t = useTranslation('paymentResult')
  const result = searchParams.get('result')

  const SUCCESS_VIEW: View = {
    Icon: SVGMarkSuccess,
    title: t('success.title'),
    message: t('success.message'),
  }

  const FAILURE_VIEW: View = {
    Icon: SVGErrorVector,
    title: t('failure.title'),
    message: t('failure.message'),
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
