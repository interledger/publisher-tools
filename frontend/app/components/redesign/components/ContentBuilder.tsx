import React, { useState, useRef, useEffect } from 'react'
import { useUI } from '~/stores/uiStore'
import { BuilderAccordion } from './BuilderAccordion'
import {
  InputField,
  TextareaField,
  Divider,
  Checkbox,
  PillRadioListItem
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
}

interface ContentBuilderProps {
  content: ToolContent
  onRefresh: () => void
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  content,
  onRefresh
}) => {
  const [isMessageActive, setIsMessageActive] = useState(true)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { actions: uiActions, state: uiState } = useUI()

  useEffect(() => {
    if (
      titleInputRef.current &&
      titleInputRef.current.value !== content.currentTitle
    ) {
      titleInputRef.current.value = content.currentTitle
    }

    if (
      messageTextareaRef.current &&
      messageTextareaRef.current.value !== content.currentMessage
    ) {
      messageTextareaRef.current.value = content.currentMessage
    }
  }, [content.currentTitle, content.currentMessage])

  const handleToggle = (isOpen: boolean) => {
    uiActions.setActiveSection(isOpen ? 'content' : null)
    if (isOpen) {
      uiActions.setContentComplete(true)
    }
  }

  return (
    <BuilderAccordion
      title="Content"
      isComplete={uiState.contentComplete}
      onToggle={handleToggle}
      onRefresh={onRefresh}
      onDone={() => {
        uiActions.setContentComplete(true)
      }}
      initialIsOpen={uiState.activeSection === 'content'}
    >
      <div className="flex flex-col gap-lg">
        <div
          role="group"
          aria-labelledby="label-suggested-title"
          className="flex flex-col gap-xs"
        >
          <div
            id="label-suggested-title"
            className="text-base leading-md font-bold text-text-primary"
          >
            Suggested title
          </div>
          <div
            className="flex flex-wrap gap-xs group"
            onChange={(ev) => {
              const input = ev.target as HTMLInputElement
              content.onSuggestedTitleClick(input.value)
            }}
          >
            {content.suggestedTitles.map((title) => (
              <PillRadioListItem
                key={title}
                value={title}
                selected={content.currentTitle === title}
                radioGroup="suggested-title"
              >
                {title}
              </PillRadioListItem>
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
                ref={messageTextareaRef}
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
    </BuilderAccordion>
  )
}

export default ContentBuilder
