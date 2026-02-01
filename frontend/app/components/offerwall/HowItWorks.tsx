import React from 'react'
import { SVGStepArrow } from '@/assets'
import step1 from '~/assets/images/offerwall/illustration_offerwall_step1.svg'
import step2 from '~/assets/images/offerwall/illustration_offerwall_step2.svg'
import step3 from '~/assets/images/offerwall/illustration_offerwall_step3.svg'
import {
  BodyEmphasis,
  Heading2SemiBold,
  Heading5,
} from '~/components/redesign/Typography'

interface StepProps {
  stepNumber: number
  image: string
  description: string
}

const Step: React.FC<StepProps> = ({ stepNumber, image, description }) => (
  <article
    className="flex flex-1 flex-col items-center gap-2xl"
    aria-labelledby={`step-${stepNumber}-description`}
  >
    <div
      className="h-[160px] overflow-hidden"
      role="img"
      aria-label={description}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="h-full w-auto object-contain"
      />
    </div>
    <BodyEmphasis
      id={`step-${stepNumber}-description`}
      className="text-center !text-green-400"
    >
      {description}
    </BodyEmphasis>
  </article>
)

const Heading: React.FC = () => {
  return (
    <section
      className="flex max-w-[1280px] flex-col gap-2xl rounded-md px-md"
      aria-labelledby="how-it-works-heading"
    >
      <header className="flex flex-col gap-md">
        <Heading2SemiBold id="how-it-works-heading">
          How it works
        </Heading2SemiBold>
        <Heading5 as="p" className="!text-text-primary">
          To use Web Monetization with Google Offerwall, you need a Google Ad
          Manager account.
          <br />
          Customize the user choice screen here, then copy the generated script
          into your Offerwall custom choice option.
        </Heading5>
      </header>

      <ol
        className="flex w-full list-none items-center p-0"
        aria-label="Steps to use Web Monetization with Google Offerwall"
      >
        <li className="flex flex-1">
          <Step
            stepNumber={1}
            image={step1}
            description="You can customize the banner"
          />
        </li>

        <li>
          <SVGStepArrow className="h-[15px] w-[187px]" />
        </li>

        <li className="flex flex-1">
          <Step
            stepNumber={2}
            image={step2}
            description="You use what they customized on OfferWall to use WM as a custom choice"
          />
        </li>

        <li>
          <SVGStepArrow className="h-[15px] w-[187px]" />
        </li>

        <li className="flex flex-1">
          <Step
            stepNumber={3}
            image={step3}
            description="You start receiving support as users choose to use WM and install the extension"
          />
        </li>
      </ol>
    </section>
  )
}

export default Heading
