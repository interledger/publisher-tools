import { cx } from 'class-variance-authority'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { SVGCheckIcon, SVGCopyIcon } from '~/assets/svg'

type CodeBlockProps = {
  link: string
  className?: string
  copyButtonClassName?: string
  onCopy?: (copied: boolean) => void
}

export const CodeBlockLink = ({
  link,
  className,
  copyButtonClassName,
  onCopy
}: CodeBlockProps) => {
  const { isCopied, handleCopyClick } = useCopyToClipboard(
    `<link rel="monetization" href="${link}" />`,
    onCopy
  )

  return (
    <div
      className={cx(
        'flex items-center justify-between rounded-sm bg-interface-bg-main',
        className
      )}
    >
      <output className="font-mono flex-1 overflow-x-auto whitespace-nowrap p-sm text-sm leading-normal">
        <span>&lt;</span>
        <span style={{ color: '#00009F' }}>link </span>
        <span style={{ color: '#00A4DB' }}>rel</span>
        <span>=&quot;</span>
        <span style={{ color: '#E3116C' }}>monetization</span>
        <span>&quot; </span>
        <span style={{ color: '#00A4DB' }}>href</span>
        <span>=&quot;</span>
        <span style={{ color: '#E3116C' }}>{link}</span>
        <span>&quot; /&gt;</span>
      </output>
      <button
        type="button"
        className={cx(
          'sticky right-0 h-full flex items-center justify-center p-xs rounded-sm bg-interface-bg-main flex-shrink-0',
          copyButtonClassName
        )}
        onClick={handleCopyClick}
        aria-label={
          isCopied
            ? 'Monetization tag copied to clipboard'
            : 'Copy monetization tag to clipboard'
        }
      >
        {isCopied ? (
          <SVGCheckIcon className="h-6 w-6" />
        ) : (
          <SVGCopyIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}
