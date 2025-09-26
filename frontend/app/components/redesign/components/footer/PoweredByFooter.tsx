import interledgerLogoIcon from '~/assets/images/interledger_logo.svg'

export const PoweredByFooter = () => {
  return (
    <footer className="flex flex-shrink-0 flex-col items-center gap-lg pb-lg">
      <hr className="w-full border-silver-200" />
      <div className="flex items-center text-text-primary font-normal text-sm leading-xs gap-[6.25px]">
        Powered by
        <a
          href="https://webmonetization.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={interledgerLogoIcon}
            className="h-6"
            alt="Interledger logo"
          />
        </a>
      </div>
    </footer>
  )
}
