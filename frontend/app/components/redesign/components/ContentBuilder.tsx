import React, { useState, useRef, useEffect } from 'react'
import { useUI } from '~/stores/uiStore'
import { BuilderAccordion } from './BuilderAccordion'
import {
  ToolsSecondaryButton,
  InputField,
  TextareaField,
  Divider,
  Checkbox,
  PillTagButton
} from '@/components'

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

  const handleToggle = (isOpen: boolean) => {
    if (isOpen) {
      uiActions.setContentComplete(true)
    }
  }

  const handleRefresh = () => {
    console.log('Refresh')
    content.onRefresh()
  }

  const handleDoneClick = () => {
    if (onDone) {
      onDone()
    }
  }

  return (
    <BuilderAccordion
      title="Content"
      isComplete={isComplete}
      activeVersion={activeVersion}
      onToggle={handleToggle}
      onRefresh={handleRefresh}
    >
      <div className="flex flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <h4 className="text-base leading-md font-bold text-text-primary">
            Suggested title
          </h4>
          <div className="flex flex-wrap gap-xs">
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

        <div className="flex flex-col gap-xs">
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

        <div className="flex flex-col gap-xs">
          <h4 className="text-base leading-md font-bold text-text-primary">
            {content.messageLabel}
          </h4>
          <div className="flex gap-lg items-start xl:flex-row flex-col">
            <div className="flex items-center gap-xs shrink-0">
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
    </BuilderAccordion>
  )
}

export default ContentBuilder
