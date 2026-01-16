import { SVGFooterDivider } from '@/assets'
import { BodyStandardLink, Copyright } from '@/components'
import socialGitGubIcon from '~/assets/images/icons/social-github.svg?url'
import socialInstagramIcon from '~/assets/images/icons/social-instagram.svg?url'
import socialLinkedInIcon from '~/assets/images/icons/social-linkedin.svg?url'
import socialSlackIcon from '~/assets/images/icons/social-slack.svg?url'
import socialYoutubeIcon from '~/assets/images/icons/social-youtube.svg?url'
import wmLogo from '~/assets/images/wm_logo.svg?url'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/company/interledger-foundation/',
    icon: socialLinkedInIcon,
    text: 'LinkedIn',
  },
  {
    href: 'https://interledger.slack.com/archives/CNYTXJKMX',
    icon: socialSlackIcon,
    text: 'Slack',
  },
  {
    href: 'https://www.instagram.com/interledgerfoundation/',
    icon: socialInstagramIcon,
    text: 'Instagram',
  },
  {
    href: 'https://github.com/interledger',
    icon: socialGitGubIcon,
    text: 'GitHub',
  },
  {
    href: 'https://www.youtube.com/@interledgerfoundation',
    icon: socialYoutubeIcon,
    text: 'YouTube',
  },
]

const SocialLinks = ({ className }: { className: string }) => (
  <nav className={className} aria-label="Social media links">
    {socialLinks.map((social) => (
      <a key={social.text} href={social.href} target="_blank" rel="noreferrer">
        <img src={social.icon} alt={social.text} />
      </a>
    ))}
  </nav>
)

export const EnhancedFooter = () => {
  return (
    <footer className="w-full rounded-2xl bg-footer-bg p-md md:p-xl mx-auto max-w-none flex flex-col gap-2xl md:gap-lg items-center justify-center">
      <nav
        className="flex flex-col md:flex-row gap-2xl md:gap-lg items-center md:items-start justify-center md:justify-start w-full max-w-4xl"
        aria-label="Footer"
      >
        <div className="flex-1 flex flex-col gap-sm items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider className="w-[38px] h-[5px]" />
          <BodyStandardLink href="https://community.interledger.org/">
            Community
          </BodyStandardLink>
          <BodyStandardLink href="https://github.com/WICG/webmonetization">
            GitHub
          </BodyStandardLink>
          <BodyStandardLink href="https://interledger.org/blog">
            Blog
          </BodyStandardLink>
          <BodyStandardLink href="https://interledger.org/faq">
            FAQ
          </BodyStandardLink>
        </div>

        <div className="hidden md:block w-px h-36 bg-blue-300" />

        <div className="flex-1 flex flex-col gap-md items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider className="w-[38px] h-[5px]" />
          <BodyStandardLink href="https://interledger.org">
            Interledger Foundation
          </BodyStandardLink>
          <BodyStandardLink href="https://wicg.io/">
            Web Incubator Community Group
          </BodyStandardLink>
          <BodyStandardLink href="https://interledger.org/summit">
            Summit
          </BodyStandardLink>
        </div>

        <div className="hidden md:block w-px h-36 bg-blue-300" />

        <div className="flex-1 flex flex-col gap-md items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider className="w-[38px] h-[5px]" />
          <BodyStandardLink href="https://www.iubenda.com/privacy-policy/95080147">
            Privacy Policy
          </BodyStandardLink>
          <BodyStandardLink href="https://www.iubenda.com/privacy-policy/95080147/cookie-policy">
            Cookie Policy
          </BodyStandardLink>
          <BodyStandardLink href="https://www.iubenda.com/terms-and-conditions/95080147">
            Terms & Conditions
          </BodyStandardLink>
        </div>
      </nav>

      <div className="flex md:hidden flex-col gap-md items-center justify-start w-full">
        <div className="flex flex-row gap-sm items-center justify-start">
          <img src={wmLogo} alt="Web Monetization Logo" />
          <p className="text-style-small-standard">Web Monetization</p>
        </div>
        <div className="w-full h-px bg-purple-100" aria-hidden="true" />
        <SocialLinks className="w-full flex flex-row items-center justify-between" />
      </div>

      <SocialLinks className="hidden md:flex w-[200px] flex-row items-center justify-between" />

      <div
        className="hidden md:block w-full h-px bg-purple-100"
        aria-hidden="true"
      />

      <div className="hidden md:flex flex-row gap-sm items-center justify-start">
        <img src={wmLogo} alt="Web Monetization Logo" />
        <p className="text-style-small-standard">Web Monetization</p>
      </div>

      <Copyright />
    </footer>
  )
}
