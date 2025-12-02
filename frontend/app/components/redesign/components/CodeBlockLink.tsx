import { cx } from 'class-variance-authority'
import { SVGCheckIcon, SVGCopyIcon } from '~/assets/svg'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

type CodeBlockProps = {
  link: string
  className?: string
  onCopy?: (copied: boolean) => void
}

export const CodeBlockLink = ({ link, className, onCopy }: CodeBlockProps) => {
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
      <CodeOutput link={link} />
      <CopyButton isCopied={isCopied} onCopyClick={handleCopyClick} />
    </div>
  )
}

const CodeOutput = ({ link }: { link: string }) => {
  return (
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
  )
}

const CopyButton = ({
  isCopied,
  onCopyClick
}: {
  isCopied: boolean
  onCopyClick: () => void
}) => {
  return (
    <button
      type="button"
      className="sticky right-0 h-full flex items-center justify-center p-xs rounded-sm bg-interface-bg-main flex-shrink-0"
      onClick={onCopyClick}
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
  )
}
