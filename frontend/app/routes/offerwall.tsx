import { useNavigate, type MetaFunction } from 'react-router'
import { HeadingCore } from '@/components'
import HowItWorks from '~/components/offerwall/HowItWorks'

export const meta: MetaFunction = () => {
  return [
    { title: 'Offerwall - Publisher Tools' },
    {
      name: 'description',
      content:
        "Help your users who don't have Web Monetization enabled discover it and support your content.",
    },
  ]
}

export default function Offerwall() {
  const navigate = useNavigate()

  return (
    <div className="bg-interface-bg-main w-full">
      <div className="flex flex-col items-center pt-[60px] md:pt-3xl">
        <div className="w-full max-w-[1280px] px-md">
          <HeadingCore
            title="Offerwall experience"
            onBackClick={() => navigate('/')}
          >
            The Offerwall experience helps visitors who don’t yet have Web
            Monetization enabled discover it and support your content.
          </HeadingCore>
          <HowItWorks />
        </div>
      </div>
    </div>
  )
}
