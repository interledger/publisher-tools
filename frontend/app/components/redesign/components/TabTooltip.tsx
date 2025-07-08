import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface TabTooltipProps {
  children: React.ReactNode
  text: string
  className?: string
}

export function TabTooltip({
  children,
  text,
  className = ''
}: TabTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const isTextTruncated =
          textRef.current.scrollWidth > textRef.current.clientWidth
        setShouldShowTooltip(isTextTruncated)
      }
    }

    checkTruncation()
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [text])

  /**
   * Handles mouse enter event to show tooltip.
   * Calculates position based on text element's bounding rect.
   * Ensures tooltip is centered and within viewport bounds.
   * If text is not truncated, tooltip will not show.
   */
  const handleMouseEnter = () => {
    if (shouldShowTooltip && textRef.current) {
      const rect = textRef.current.getBoundingClientRect()
      const tooltipWidth = 200

      let x = rect.left + rect.width / 2 - tooltipWidth / 2
      const y = rect.top - 48

      x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10))

      setTooltipPosition({ x, y })
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }
  return (
    <>
      <div className="relative w-full">
        <p
          ref={textRef}
          className={`w-[150px] text-base leading-md font-normal overflow-hidden whitespace-nowrap text-ellipsis ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </p>
      </div>
      {isVisible &&
        shouldShowTooltip &&
        createPortal(
          <div
            className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              pointerEvents: 'none'
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  )
}

export default TabTooltip
