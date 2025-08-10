import React, { useState, useRef, useEffect } from 'react'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '@/assets'
import {
  ToolsSecondaryButton,
  InputField,
  TextareaField,
  Divider,
  Checkbox,
  PillTagButton
} from '@/components'
import { Heading5 } from '@/typography'

export interface ToolContent {
  suggestedTitles: string[]
  titleHelpText: string
  titleMaxLength: number
  messageLabel: string
  messagePlaceholder: string
  messageHelpText: string
  messageMaxLength: number

  currentTitle: string
  currentMessage: string

  onTitleChange: (title: string) => void
  onMessageChange: (message: string) => void
  onSuggestedTitleClick: (title: string) => void
  onRefresh: () => void
}

interface ContentBuilderProps {
  content: ToolContent
  isComplete?: boolean
  className?: string
  isExpanded?: boolean
  onToggle?: () => void
  onDone?: () => void
  /** key identifier that changes only when switching configurations */
  key?: string
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  content,
  isComplete,
  isExpanded = false,
  onToggle,
  onDone,
  key
}) => {
  const [isMessageActive, setIsMessageActive] = useState(true)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (
      titleInputRef.current &&
      titleInputRef.current.value !== content.currentTitle
    ) {
      titleInputRef.current.value = content.currentTitle
    }
  }, [content.currentTitle])

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
        role="button"
        tabIndex={0}
        aria-label="Expand content section"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpand()
          }
        }}
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
              content.onRefresh()
            }}
            aria-label="Reset content to default"
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
            {content.suggestedTitles.map((title) => (
              <PillTagButton
                key={title}
                variant={content.currentTitle === title ? 'active' : 'default'}
                onClick={() => content.onSuggestedTitleClick(title)}
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
            key={`${key}-title`}
            ref={titleInputRef}
            defaultValue={content.currentTitle}
            onChange={(e) => {
              content.onTitleChange(e.target.value)
            }}
            maxLength={content.titleMaxLength}
            helpText={content.titleHelpText}
            className="h-12 text-base leading-md"
          />
          <div className="flex justify-end">
            <span className="text-xs leading-xs text-text-secondary">
              {content.currentTitle.length}/{content.titleMaxLength}
            </span>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-2">
          <h4 className="text-base leading-md font-bold text-text-primary">
            {content.messageLabel}
          </h4>
          <div className="flex gap-lg items-start xl:flex-row flex-col">
            <div className="flex items-center gap-2 shrink-0">
              <Checkbox
                checked={isMessageActive}
                onChange={() => setIsMessageActive(!isMessageActive)}
                label="Active"
              />
            </div>

            <div className="flex-grow">
              <TextareaField
                key={`${key}-message`}
                defaultValue={content.currentMessage}
                onChange={(e) => {
                  content.onMessageChange(e.target.value)
                }}
                currentLength={content.currentMessage.length || 0}
                maxLength={content.messageMaxLength}
                showCounter={true}
                helpText={content.messageHelpText}
                className="h-[84px]"
                placeholder={content.messagePlaceholder}
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

export default ContentBuilder
