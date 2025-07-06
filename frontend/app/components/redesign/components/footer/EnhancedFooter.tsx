import React from 'react'
import wmLogo from '~/assets/images/wm_logo.svg?url'
import inSocialIcon from '~/assets/images/footer/in_social.svg?url'
import slkSocialIcon from '~/assets/images/footer/slk_social.svg?url'
import instSocialIcon from '~/assets/images/footer/inst_social.svg?url'
import ghSocialIcon from '~/assets/images/footer/gh_social.svg?url'
import ytSocialIcon from '~/assets/images/footer/yt_social.svg?url'
import { SVGFooterDivider } from '~/assets/svg'
import { BodyStandard } from '../../Typography'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/company/interledger-foundation/',
    icon: inSocialIcon
  },
  {
    href: 'https://interledger.slack.com/archives/CNYTXJKMX',
    icon: slkSocialIcon
  },
  {
    href: 'https://www.instagram.com/interledgerfoundation/',
    icon: instSocialIcon
  },
  { href: 'https://github.com/interledger', icon: ghSocialIcon },
  {
    href: 'https://www.youtube.com/@interledgerfoundation',
    icon: ytSocialIcon
  }
]

const SocialLinks = ({ className }: { className: string }) => (
  <div className={className}>
    {socialLinks.map((social, index) => (
      <a key={index} href={social.href} target="_blank" rel="noreferrer">
        <img src={social.icon} />
      </a>
    ))}
  </div>
)

export const EnhancedFooter = () => {
  return (
    <footer className="w-full rounded-2xl bg-footer-bg p-md md:p-xl mx-auto max-w-none flex flex-col gap-2xl md:gap-lg items-center justify-center">
      <div className="flex flex-col md:flex-row gap-2xl md:gap-lg items-center md:items-start justify-center md:justify-start w-full max-w-4xl">
        <div className="flex-1 flex flex-col gap-sm items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider />
          <BodyStandard>Community</BodyStandard>
          <BodyStandard>GitHub</BodyStandard>
          <BodyStandard>Blog</BodyStandard>
          <BodyStandard>FAQ</BodyStandard>
        </div>

        <div className="hidden md:block w-px h-36 bg-blue-300" />

        <div className="flex-1 flex flex-col gap-md items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider />
          <BodyStandard>Interledger Foundation</BodyStandard>
          <BodyStandard>Web Incubator Community Group</BodyStandard>
          <BodyStandard>Summit</BodyStandard>
        </div>

        <div className="hidden md:block w-px h-36 bg-blue-300" />

        <div className="flex-1 flex flex-col gap-md items-center md:items-start justify-center w-full md:w-auto">
          <SVGFooterDivider />
          <BodyStandard>Privacy Policy</BodyStandard>
          <BodyStandard>Cookie Policy</BodyStandard>
          <BodyStandard>Terms & conditions</BodyStandard>
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-md items-center justify-start w-full">
        <div className="flex flex-row gap-sm items-center justify-start">
          <img src={wmLogo} alt="Web Monetization Logo" />
          <p className="text-style-small-standard">Web Monetization</p>
        </div>
        <div className="w-full h-px bg-purple-100" />
        <SocialLinks className="w-full flex flex-row items-center justify-between" />
      </div>

      <SocialLinks className="hidden md:flex w-[200px] flex-row items-center justify-between" />

      <div className="hidden md:block w-full h-px bg-purple-100" />

      <div className="hidden md:flex flex-row gap-sm items-center justify-start">
        <img src={wmLogo} alt="Web Monetization Logo" />
        <p className="text-style-small-standard">Web Monetization</p>
      </div>

      <p className="!text-footer-content text-style-small-standard">
        Copyright © {new Date().getFullYear()} Interledger Foundation.
      </p>
    </footer>
  )
}
