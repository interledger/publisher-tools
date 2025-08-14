import React, { useState, useRef, useEffect } from 'react'
import { useUI } from '~/stores/uiStore'
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
  onDone?: () => void
  activeVersion?: string
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  content,
  isComplete,
  onDone,
  activeVersion
}) => {
  const [isMessageActive, setIsMessageActive] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { actions: uiActions } = useUI()

  useEffect(() => {
    if (
      titleInputRef.current &&
      titleInputRef.current.value !== content.currentTitle
    ) {
      titleInputRef.current.value = content.currentTitle
    }
  }, [content.currentTitle])

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const details = e.currentTarget
    if (details.open) {
      // set as complete when opened for the first time
      setIsOpen(true)
      uiActions.setContentComplete(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleDoneClick = () => {
    if (onDone) {
      onDone()
    }
  }

  return (
    <details
      key={activeVersion}
      name="builder-accordion"
      className={`flex flex-col rounded-lg transition-all duration-300 ease-in-out ${
        isOpen ? 'bg-interface-bg-container' : 'bg-interface-bg-main'
      }`}
      onToggle={handleToggle}
      open={isOpen}
    >
      <summary
        className={`flex items-center justify-between cursor-pointer transition-all duration-300 ease-in-out list-none ${
          isOpen ? 'px-2xs py-xs' : 'pl-md pr-2xs py-xs'
        }`}
        aria-label="Toggle content section"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {isComplete && !isOpen && <SVGGreenVector className="w-6 h-[18px]" />}
          <Heading5>Content</Heading5>
        </div>

        <div className="flex gap-2">
          {isOpen && (
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
          )}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              !isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            <SVGArrowCollapse className="w-5 h-5" />
          </div>
        </div>
      </summary>

      <div
        className="flex flex-col"
        role="region"
        aria-labelledby="content-section"
      >
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <h4
              id="content-section"
              className="text-base leading-md font-bold text-text-primary"
            >
              Suggested title
            </h4>
            <div className="flex flex-wrap gap-2">
              {content.suggestedTitles.map((title) => (
                <PillTagButton
                  key={title}
                  variant={
                    content.currentTitle === title ? 'active' : 'default'
                  }
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
    </details>
  )
}

export default ContentBuilder
