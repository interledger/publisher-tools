import React from 'react'
import { useUI } from '~/stores/uiStore'
import { Divider } from '@/components'
import { BuilderAccordion } from './BuilderAccordion'
import { TitleInput } from './builder/TitleInput'
import { DescriptionInput } from './builder/DescriptionInput'

export interface ContentConfig {
  suggestedTitles: string[]

  titleHelpText: string
  titleMaxLength: number

  messageLabel: string
  messagePlaceholder: string
  messageHelpText: string
  messageMaxLength: number
}

export interface ToolContent {
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
  config: ContentConfig
  onRefresh: () => void
}

export const ContentBuilder: React.FC<ContentBuilderProps> = ({
  config,
  profile,
  onRefresh
}) => {
  const { actions: uiActions, state: uiState } = useUI()

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
          suggestions={config.suggestedTitles}
          maxLength={config.titleMaxLength}
          helpText={config.titleHelpText}
        />

        <Divider />

        <DescriptionInput
          label={config.messageLabel}
          value={profile.currentMessage}
          onChange={profile.onMessageChange}
          isVisible={profile.isDescriptionVisible}
          onVisibilityChange={(visible) => {
            profile.onDescriptionVisibilityChange(visible)
          }}
          maxLength={config.messageMaxLength}
          helpText={config.messageHelpText}
          placeholder={config.messagePlaceholder}
        />
      </div>
    </BuilderAccordion>
  )
}

export default ContentBuilder
