export const Footer = () => {
  return (
    <footer className="w-full pb-xl mt-2xl bg-interface-bg-main">
      <div className="flex flex-row items-center justify-center w-full">
        <Copyright />
      </div>
    </footer>
  )
}

export function Copyright() {
  return (
    <p className="!text-field-helpertext-default text-style-small-standard text-center max-w-7xl px-4">
      <CopyrightLink href="https://www.w3.org/policies/#copyright">
        Copyright
      </CopyrightLink>
      © {new Date().getFullYear()} the Contributors to the Web Monetization
      Specification, published by the{' '}
      <CopyrightLink href="https://www.w3.org/community/wicg/">
        Web Platform Incubator Community Group
      </CopyrightLink>{' '}
      under the{' '}
      <CopyrightLink href="https://www.w3.org/community/about/agreements/cla/">
        W3C Community Contributor License Agreement (CLA)
      </CopyrightLink>
      . A human-readable{' '}
      <CopyrightLink href="http://www.w3.org/community/about/agreements/cla-deed/">
        summary
      </CopyrightLink>{' '}
      is available.
    </p>
  )
}

function CopyrightLink({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-inherit underline"
    >
      {children}
    </a>
  )
}
