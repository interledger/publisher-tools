import type { MetaFunction } from '@remix-run/cloudflare'
import { ToolCard } from '~/components/redesign/components/landing/ToolCard'
import { Typography } from '~/components/redesign/Typography'
import SVGLinkGenerator from '~/assets/images/landing/illustration_link_generator.svg?url'
import SVGRevShareGenerator from '~/assets/images/landing/illustration_rev_share.svg?url'
import SVGBanner from '~/assets/images/landing/illustration_banner.svg?url'
import SVGWidget from '~/assets/images/landing/illustration_widget.svg?url'
import SVGButton from '~/assets/images/landing/illustration_button.svg?url'
import SVGHeadingVector from '~/assets/images/landing/tools-heading-vector.svg?url'

const DEFAULT_TITLE = 'Web Monetization Tools'
const DEFAULT_DESCRIPTION = 'Choose and customize your tools!'
const DEFAULT_IMAGE_URL = 'https://webmonetization.org/img/wm-social.png'
const DEFAULT_URL = 'https://webmonetization.org/tools'
const SITE_NAME = 'Web Monetization'

const setupTools = [
  {
    title: 'Link-tag generator',
    description:
      'The most classic, yet one of the most effective methods in order to link to your supporters. Ladies and gents, the button!',
    tags: ['flawless', 'dynamic', 'high click rate', 'link tag', 'generator'],
    icon: SVGLinkGenerator
  },
  {
    title: 'Probabilistic revshare',
    description:
      'The most classic, yet one of the most effective methods in order to link to your supporters. Ladies and gents, the button!',
    tags: ['flawless', 'dynamic', 'high click rate', 'revshare', 'generator'],
    icon: SVGRevShareGenerator
  }
]

const interactionTools = [
  {
    title: 'Banner',
    description:
      'An invitation to support will seamlessly slide into the interface of your website interface. Very elegant and eye catchy.',
    tags: ['flawless', 'dynamic', 'high click rate', 'banner'],
    icon: SVGBanner
  },
  {
    title: 'Widget',
    description:
      "A sticky button that follows the visitors wherever they go. When they press it, we'll make sure that they know what to do.",
    tags: ['flawless', 'dynamic', 'high click rate', 'widget'],
    icon: SVGWidget
  },
  {
    title: 'Call-to-Action button',
    description:
      'The most classic, yet one of the most effective methods in order to link to your supporters. Ladies and gents, the button!',
    tags: ['flawless', 'dynamic', 'high click rate', 'button'],
    icon: SVGButton
  }
]

export const meta: MetaFunction = () => {
  const title = DEFAULT_TITLE
  const description = DEFAULT_DESCRIPTION
  const imageUrl = DEFAULT_IMAGE_URL
  const pageUrl = DEFAULT_URL

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: pageUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { tagName: 'link', rel: 'canonical', href: pageUrl }
  ]
}

export default function Index() {
  return (
    <div className="bg-interface-bg-main min-h-screen flex flex-col gap-2xl items-center pt-5xl pb-xl px-0">
      <div className="flex flex-col gap-2xl items-center justify-start px-md py-0 w-full max-w-[1280px]">
        <div className="flex flex-col gap-xs items-center justify-start p-0 w-full">
          <Typography
            variant="h1"
            className="!leading-normal !text-[42px] max-xl:!text-style-h2-semibold text-center"
          >
            Web Monetization Tools
          </Typography>
          <img
            alt="Decorative underline"
            className="block max-w-none h-[23px] w-[442px] max-xl:h-[13px] max-xl:w-[247px]"
            src={SVGHeadingVector}
          />
        </div>

        <Typography
          variant="h5"
          className="!text-landing-content text-center w-full max-xl:!text-style-body-standard"
        >
          We care about your public and your option you want to help them
          support you. Feel free to choose any interaction.
        </Typography>
      </div>

      <div
        id="content"
        className="flex flex-col gap-2.5 items-center justify-start p-0 w-full"
      >
        <div className="max-w-[1280px] w-full flex flex-col gap-md items-center justify-start px-md py-0">
          <Typography variant="h3" className="w-full max-xl:text-center">
            Setup tools
          </Typography>

          <Typography
            variant="h5"
            className="!text-landing-content text-left w-full max-xl:!text-style-small-standard max-xl:text-center"
          >
            We care about your public and your option you want to help them
            support you. Feel free to choose any interaction.
          </Typography>

          <div className="flex flex-row items-center justify-between p-0 w-full max-xl:flex-col max-xl:gap-lg max-xl:items-center">
            {setupTools.map((tool, index) => (
              <ToolCard
                key={index}
                title={tool.title}
                tags={tool.tags}
                icon={tool.icon}
              >
                {tool.description}
              </ToolCard>
            ))}
            <div className="w-[340px] opacity-0 max-xl:hidden" />
          </div>
        </div>

        <div className="max-w-[1280px] w-full flex flex-col gap-md items-center justify-start px-md py-0">
          <Typography variant="h3" className="w-full max-xl:text-center">
            Interaction tools
          </Typography>

          <Typography
            variant="h5"
            className="!text-landing-content text-left w-full max-xl:!text-style-small-standard max-xl:text-center"
          >
            We care about your public and your option you want to help them
            support you. Feel free to choose any interaction.
          </Typography>

          <div className="flex flex-row items-center justify-between p-0 w-full max-xl:flex-col max-xl:gap-lg max-xl:items-center">
            {interactionTools.map((tool, index) => (
              <ToolCard
                key={index}
                title={tool.title}
                tags={tool.tags}
                icon={tool.icon}
              >
                {tool.description}
              </ToolCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
