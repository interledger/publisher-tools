import type React from 'react'
import { type BuilderSection, useUIActions, useUIState } from '~/stores/uiStore'

export function useBuilderSectionHandlers(section: BuilderSection) {
  const uiState = useUIState()
  const uiActions = useUIActions()

  if (section === 'content') {
    return {
      isComplete: uiState.contentComplete,
      isOpen: uiState.activeSection === 'content',
      onClick: (isOpen: boolean) => {
        uiActions.setActiveSection(
          isOpen ? 'content' : uiState.appearanceComplete ? null : 'appearance',
        )
      },
      onToggle: (e: React.SyntheticEvent<HTMLDetailsElement>) => {
        if (e.currentTarget.open) {
          uiActions.setContentComplete(true)
        }
      },
    }
  }

  return {
    isComplete: uiState.appearanceComplete,
    isOpen: uiState.activeSection === 'appearance',
    onClick: (isOpen: boolean) => {
      uiActions.setActiveSection(
        isOpen ? 'appearance' : uiState.contentComplete ? null : 'content',
      )
    },
    onToggle: (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      if (e.currentTarget.open) {
        uiActions.setAppearanceComplete(true)
      }
    },
  }
}
