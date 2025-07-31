import React from 'react'
import { useSnapshot } from 'valtio'
import { toolState } from '~/stores/toolStore'
import { ToolsSecondaryButton } from '@/components'

const BrowserDots = () => (
  <svg width="39" height="8" viewBox="0 0 39 8" fill="none">
    <circle cx="4" cy="4" r="3.5" fill="#FF5F57" stroke="#E0443E" />
    <circle cx="20" cy="4" r="3.5" fill="#FFBD2E" stroke="#DEA123" />
    <circle cx="35" cy="4" r="3.5" fill="#28CA42" stroke="#1AAB29" />
  </svg>
)

interface BuilderBackgroundProps {
  className?: string
  children?: React.ReactNode
  onPreviewClick?: () => void
}

export const BuilderBackground: React.FC<BuilderBackgroundProps> = ({
  className = '',
  children,
  onPreviewClick
}) => {
  const snap = useSnapshot(toolState)
  const isWidgetTool = snap.currentToolType === 'widget'

  const createDotPattern = () => {
    const svgString = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="2" fill="white" fill-opacity="0.5" /></svg>`

    return `data:image/svg+xml;base64,${btoa(svgString)}`
  }

  return (
    <div
      id="builder-background"
      className={`
        bg-[#efefef]
        rounded-[20px]
        p-4
        flex flex-col gap-2.5 items-center justify-end
        min-h-[600px]
        relative
        ${className}
      `}
      style={{
        backgroundImage: `url("${createDotPattern()}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '16px 16px'
      }}
    >
      {onPreviewClick && (
        <ToolsSecondaryButton
          icon="play"
          className="w-[130px] order-first mb-auto"
          onClick={onPreviewClick}
        >
          Preview
        </ToolsSecondaryButton>
      )}

      <div
        id="browser-mockup"
        className={`w-full bg-transparent rounded-2xl border border-field-border overflow-hidden flex flex-col ${
          isWidgetTool ? 'h-[752px]' : 'h-[406px]'
        }`}
      >
        <div className="flex items-center p-md bg-white">
          <div className="flex items-center gap-4 w-full">
            <BrowserDots />
            <div className="flex-1 h-2 bg-field-border rounded-full" />
          </div>
        </div>

        <div
          id="browser-content"
          className={`flex-1 p-md flex justify-center bg-transparent ${
            snap.currentConfig?.bannerPosition === 'Top'
              ? 'items-start'
              : 'items-end'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default BuilderBackground
