import type { MetaFunction } from '@remix-run/cloudflare'
import { ToolCard } from '~/components/redesign/components/landing/ToolCard'
import { Heading1, Heading3, Heading5 } from '~/components/redesign/Typography'
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
    title: 'Link tag generator',
    description:
      'Generate the <link rel="monetization"> tag required to enable Web Monetization on your web pages.',
    tags: [
      'Web Monetization',
      'Easy integration',
      'Easy setup',
      'HTML tag',
      'No code'
    ],
    icon: SVGLinkGenerator,
    link: '/link-tag/'
  },
  {
    title: 'Probabilistic revenue share',
    description:
      'Split Web Monetization revenue across multiple payment pointers/wallets using probabilistic algorithms',
    tags: [
      'Web Monetization',
      'Shared revenue',
      'Automatic split',
      'Fair payout'
    ],
    icon: SVGRevShareGenerator,
    link: '/prob-revshare/'
  }
]

const interactionTools = [
  {
    title: 'Banner',
    description:
      'Show a customizable banner to introduce Web Monetization. The banner disappears when dismissed or the extension is installed.',
    tags: [
      'Web Monetization',
      'Visibility boost',
      'Audience education',
      'Engagement'
    ],
    icon: SVGBanner,
    link: '/banner'
  },
  {
    title: 'Widget',
    description: `A floating icon that lets visitors support you with one-time payments. No extension needed, simple and flexible.`,
    tags: [
      'Web Monetization',
      'One time support',
      'Pay with Interledger',
      'Engagement'
    ],
    icon: SVGWidget,
    link: '/widget'
  },
  {
    title: 'Call-to-Action button',
    description:
      'The most classic, yet one of the most effective methods in order to link to your supporters. Ladies and gents, the button!',
    tags: ['flawless', 'dynamic', 'high click rate', 'button'],
    icon: SVGButton,
    link: '/button',
    disabled: true
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
          <Heading1 className="!leading-normal !text-[42px] max-xl:!text-style-h2-semibold text-center">
            Web Monetization Tools
          </Heading1>
          <img
            alt="Decorative underline"
            className="block max-w-none h-[23px] w-[442px] max-xl:h-[13px] max-xl:w-[247px]"
            src={SVGHeadingVector}
          />
        </div>

        <Heading5 className="!text-landing-content text-center w-full max-xl:!text-style-body-standard">
          Use our suite of tools to set up and promote Web Monetization.
          Encourage your visitors to support your content and website.
        </Heading5>
      </div>

      <div
        id="content"
        className="flex flex-col gap-2.5 items-center justify-start p-0 w-full"
      >
        <div className="max-w-[1280px] w-full flex flex-col gap-md items-center justify-start px-md py-0">
          <Heading3 className="w-full max-xl:text-center">Setup tools</Heading3>

          <Heading5 className="!text-landing-content text-left w-full max-xl:!text-style-small-standard max-xl:text-center">
            Get started quickly with tools designed to help you set up Web
            Monetization on your website
          </Heading5>

          <div className="flex flex-row items-center justify-between p-0 w-full max-md:flex-col max-md:gap-lg max-md:items-center">
            {setupTools.map((tool, index) => (
              <ToolCard
                key={index}
                title={tool.title}
                tags={tool.tags}
                icon={tool.icon}
                to={tool.link || ''}
                target={tool.link ? undefined : '_blank'}
              >
                {tool.description}
              </ToolCard>
            ))}
            <div className="w-[340px] opacity-0 max-md:hidden" />
          </div>
        </div>

        <div className="max-w-[1280px] w-full flex flex-col gap-md items-center justify-start px-md py-0">
          <Heading3 className="w-full max-xl:text-center">
            Interaction tools
          </Heading3>

          <Heading5 className="!text-landing-content text-left w-full max-xl:!text-style-small-standard max-xl:text-center">
            Add lightweight and embeddable tools, like banners and widgets, to
            your site with simple scripts. They&apos;re easily customizable,
            helping you connect with your audience to encourage Web Monetization
            support.
          </Heading5>

          <div className="flex flex-row items-center justify-between p-0 w-full max-md:flex-col max-md:gap-lg max-md:items-center">
            {interactionTools.map((tool, index) => (
              <ToolCard
                key={index}
                title={tool.title}
                tags={tool.tags}
                icon={tool.icon}
                to={tool.link}
                className={tool.disabled ? 'invisible' : ''}
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
