import React, { useState } from 'react'
import { PillTagButton } from './PillTagButton'
import { InputField } from './InputField'
import { TextareaField } from './TextareaField'
import { Heading5 } from '../Typography'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '~/assets/svg'
import Divider from './Divider'
import { Checkbox } from './Checkbox'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { useSnapshot } from 'valtio'
import { toolState, toolActions } from '~/stores/toolStore'

interface BannerContentBuilderProps {
  isComplete?: boolean
  className?: string
  isExpanded?: boolean
  onToggle?: () => void
  onDone?: () => void
}

export const BannerContentBuilder: React.FC<BannerContentBuilderProps> = ({
  isComplete,
  isExpanded = false,
  onToggle,
  onDone
}) => {
  const snap = useSnapshot(toolState)
  const [isBannerActive, setIsBannerActive] = useState(true)

  const suggestedTitles = [
    'How to support?',
    'Fund me',
    'Pay as you browse',
    'Easy donate',
    'Support my work'
  ]

  const handleSuggestedTitleClick = (title: string) => {
    toolActions.setToolConfig({ bannerTitleText: title.replace(/"/g, '') })
  }
  const handleRefresh = () => {
    toolActions.setToolConfig({ bannerTitleText: 'How to support?' })
  }

  const toggleExpand = () => {
    if (onToggle) {
      onToggle()
    }
  }

  const handleDoneClick = () => {
    if (onToggle) {
      onToggle()
    }
    if (onDone) {
      onDone()
    }
  }

  if (!isExpanded) {
    return (
      <div
        className=" bg-interface-bg-main rounded-lg cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="px-4 pr-1 py-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete && <SVGGreenVector className="w-6 h-[18px]" />}
              <Heading5>Content</Heading5>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand()
              }}
              className="w-12 h-12 rounded-lg flex items-center justify-center"
            >
              <SVGArrowCollapse className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-interface-bg-container rounded-sm gap-sm">
      <div
        className="px-1 py-2 flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
      >
        <Heading5>Content</Heading5>

        <div className="flex gap-2">
          <button
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              console.log('Refresh')
              handleRefresh()
            }}
          >
            <SVGRefresh className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onToggle) {
                onToggle()
              }
            }}
            className="w-12 h-12 rounded-lg flex items-center justify-center"
          >
            <div className="rotate-180">
              <SVGArrowCollapse className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-2">
          <h4 className="text-base leading-md font-bold text-text-primary">
            Suggested title
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTitles.map((title) => (
              <PillTagButton
                key={title}
                variant={
                  snap.currentConfig?.bannerTitleText === title
                    ? 'active'
                    : 'default'
                }
                onClick={() => handleSuggestedTitleClick(title)}
              >
                {title}
              </PillTagButton>
            ))}
          </div>
        </div>
        <Divider />

        <div className="flex flex-col gap-2">
          <h4 className="text-base leading-md font-bold text-text-primary">
            Custom title
          </h4>
          <InputField
            value={snap.currentConfig?.bannerTitleText}
            onChange={(e) =>
              toolActions.setToolConfig({ bannerTitleText: e.target.value })
            }
            maxLength={60}
            helpText="Strong message to help people engage with Web Monetization"
            className="h-12 text-base leading-md"
          />
          <div className="flex justify-end">
            <span className="text-xs leading-xs text-text-secondary">
              {snap.currentConfig?.bannerTitleText.length}/60
            </span>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-2">
          <h4 className="text-base leading-md font-bold text-text-primary">
            Banner message
          </h4>
          <div className="flex gap-lg items-start xl:flex-row flex-col">
            <div className="flex items-center gap-2 shrink-0">
              <Checkbox
                checked={isBannerActive}
                onChange={() => setIsBannerActive(!isBannerActive)}
                label="Active"
              />
            </div>

            <div className="flex-grow">
              <TextareaField
                value={snap.currentConfig?.bannerDescriptionText}
                onChange={(e) =>
                  toolActions.setToolConfig({
                    bannerDescriptionText: e.target.value
                  })
                }
                maxLength={300}
                showCounter={true}
                helpText="Strong message to help people engage with Web Monetization"
                className="h-[84px]"
                placeholder="Enter your banner message..."
              />
            </div>
          </div>
        </div>
      </div>
      <Divider />

      <div className="flex justify-end">
        <ToolsSecondaryButton
          className="w-full xl:w-[140px]"
          onClick={handleDoneClick}
        >
          Done
        </ToolsSecondaryButton>
      </div>
    </div>
  )
}

export default BannerContentBuilder
