import React, { useRef, useEffect } from 'react'
import { useUI } from '~/stores/uiStore'
import { BuilderAccordion } from './BuilderAccordion'
import { TextareaField, Divider, Checkbox } from '@/components'
import { TitleInput } from './builder/TitleInput'

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
  isDescriptionVisible: boolean

  onTitleChange: (title: string) => void
  onMessageChange: (message: string) => void
  onSuggestedTitleClick: (title: string) => void
  onDescriptionVisibilityChange: (visible: boolean) => void
}

interface ContentBuilderProps {
  profile: ToolContent
  onRefresh: () => void
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  profile,
  onRefresh
}) => {
  const titleInputRef = useRef<HTMLInputElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { actions: uiActions, state: uiState } = useUI()
  const isMessageVisible = profile.isDescriptionVisible

  useEffect(() => {
    if (
      titleInputRef.current &&
      titleInputRef.current.value !== profile.currentTitle
    ) {
      titleInputRef.current.value = profile.currentTitle
    }

    if (
      messageTextareaRef.current &&
      messageTextareaRef.current.value !== profile.currentMessage
    ) {
      messageTextareaRef.current.value = profile.currentMessage
    }
  }, [profile.currentTitle, profile.currentMessage])

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
        <TitleInput
          value={profile.currentTitle}
          onChange={profile.onTitleChange}
          suggestions={profile.suggestedTitles}
          maxLength={profile.titleMaxLength}
          helpText={profile.titleHelpText}
        />

        <Divider />

        <div className="flex flex-col gap-xs">
          <h4 className="text-base leading-md font-bold text-text-primary">
            {profile.messageLabel}
          </h4>
          <div className="flex gap-lg items-start xl:flex-row flex-col">
            <div className="flex items-center gap-xs shrink-0">
              <Checkbox
                checked={isMessageVisible}
                onChange={(visible) => {
                  profile.onDescriptionVisibilityChange(visible)
                }}
                label="Active"
              />
            </div>

            <div className="flex-grow w-full">
              <TextareaField
                ref={messageTextareaRef}
                defaultValue={profile.currentMessage}
                onChange={(e) => {
                  profile.onMessageChange(e.target.value)
                }}
                currentLength={profile.currentMessage.length || 0}
                maxLength={profile.messageMaxLength}
                showCounter={true}
                helpText={profile.messageHelpText}
                className="h-[84px]"
                placeholder={profile.messagePlaceholder}
                disabled={!isMessageVisible}
              />
            </div>
          </div>
        </div>
      </div>
    </BuilderAccordion>
  )
}

export default ContentBuilder
