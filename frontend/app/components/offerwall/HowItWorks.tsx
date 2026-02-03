import React from 'react'
import { SVGStepArrow, SVGStepArrowMobile } from '@/assets'
import { BodyEmphasis, BodyStandard, Heading4 } from '@/typography'
import step1 from '~/assets/images/offerwall/illustration_offerwall_step1.svg'
import step2 from '~/assets/images/offerwall/illustration_offerwall_step2.svg'
import step3 from '~/assets/images/offerwall/illustration_offerwall_step3.svg'

interface StepProps {
  image: string
  description: string
  showNext?: boolean
}

const Step: React.FC<StepProps> = ({
  image,
  description,
  showNext = false,
}) => (
  <li className="flex flex-col items-center xl:flex-1 xl:flex-row xl:items-center">
    <div className="flex w-[343px] flex-col items-center gap-2xl xl:w-[296px] xl:max-h-[240px] xl:flex-1">
      <img src={image} alt="" className="h-full w-auto object-contain" />
      <BodyEmphasis className="min-w-full shrink-0 text-center !text-green-400">
        {description}
      </BodyEmphasis>
    </div>
    {showNext && (
      <>
        <SVGStepArrow className="h-[15px] w-[187px] shrink-0 self-center hidden xl:block" />
        <SVGStepArrowMobile className="h-[63px] w-[15px] shrink-0 self-center block xl:hidden" />
      </>
    )}
  </li>
)

export default function HowItWorks() {
  return (
    <section
      className="flex max-w-[1280px] flex-col gap-2xl rounded-md px-md"
      aria-labelledby="how-it-works-heading"
    >
      <header className="flex flex-col items-center gap-md xl:items-start">
        <Heading4
          id="how-it-works-heading"
          className="xl:text-style-h2-semibold"
        >
          How it works
        </Heading4>
        <BodyStandard className="text-center xl:text-left xl:text-xl xl:leading-xl">
          If you have a Google Ad Manager account you can add Web Monetization
          to your Offerwall.
          <br />
          Customize the user choice screen here, then copy the script into your
          Offerwall&apos;s custom choice option.
        </BodyStandard>
      </header>

      <ol
        className="flex w-full list-none flex-col items-center p-0 xl:flex-row xl:items-center"
        aria-label="Steps to use Web Monetization with Google Offerwall"
      >
        <Step
          image={step1}
          description="Customize your Offerwall experience"
          showNext
        />
        <Step
          image={step2}
          description="Copy your customization into your Offerwall"
          showNext
        />
        <Step
          image={step3}
          description="Start receiving support as users choose to use WM"
        />
      </ol>
    </section>
  )
}
