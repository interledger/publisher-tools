import { useNavigate, type MetaFunction } from 'react-router'
import { HeadingCore, LinkTagGenerator } from '@/components'

export const meta: MetaFunction = () => {
  return [
    { title: 'Link Tag Generator - Publisher Tools' },
    {
      name: 'description',
      content:
        'Use the Link Tag Generator to generate a monetization <link> element for your HTML documents. Enter a payment pointer or wallet address to get started.',
    },
  ]
}

export default function LinkTag() {
  const navigate = useNavigate()
  return (
    <div className="bg-interface-bg-main w-full px-md">
      <div className="w-full max-w-[1280px] mx-auto pt-[60px] md:pt-3xl">
        <HeadingCore
          title="Link Tag Generator"
          onBackClick={() => navigate('/')}
        >
          Use the Link Tag Generator to generate a monetization &lt;link&gt;
          element for your HTML documents.
          <br />
          Just enter your&nbsp;
          <a href="https://paymentpointers.org/" className="underline">
            payment pointer
          </a>
          &nbsp;or&nbsp;
          <a href="https://webmonetization.org/wallets/" className="underline">
            wallet address
          </a>
          &nbsp;into the field and click Generate.
        </HeadingCore>
      </div>
      <div className="flex flex-col items-center gap-md">
        <LinkTagGenerator />
        <div className="flex-grow flex-shrink-0 basis-0 max-w-[1280px] text-center">
          <p className="text-style-body-standard !text-field-helpertext-default">
            After generating your&nbsp;
            <span className="text-style-body-standard !text-text-buttons-default">
              &lt;link&gt;
            </span>
            &nbsp;tag, add the tag to the&nbsp;
            <span className="text-style-body-standard !text-text-buttons-default">
              &lt;head&gt;
            </span>
            &nbsp;section of your website.
            <br />
            Visit our&nbsp;
            <a
              className="text-style-body-standard !text-text-buttons-default underline"
              href="https://webmonetization.org/docs/"
            >
              docs
            </a>
            &nbsp;to learn more about Web Monetization.
          </p>
        </div>
      </div>
    </div>
  )
}
