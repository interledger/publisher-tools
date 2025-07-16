import { HeadingCore, LinkTagGenerator } from '@/components'
import { useNavigate } from '@remix-run/react'

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
          element for your HTML documents. Just enter your&nbsp;
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
            After generating your
            <span className="text-style-body-standard !text-text-buttons-default">
              &lt;link&gt;
            </span>
            tag, add the tag to the
            <span className="text-style-body-standard !text-text-buttons-default">
              &lt;head&gt;
            </span>
            section of your website.
            <br />
            Visit our
            <a
              className="text-style-body-standard !text-text-buttons-default underline"
              href="https://webmonetization.org/docs/"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs
            </a>
            to learn more about Web Monetization.
          </p>
        </div>
      </div>
    </div>
  )
}
