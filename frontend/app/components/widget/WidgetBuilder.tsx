import { FONT_FAMILY_OPTIONS, WIDGET_FONT_SIZES } from '@shared/types'
import {
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
  WidgetPositionSelector,
  WidgetColorsSelector,
  BuilderAccordion,
  SectionHeader,
  Slider
} from '@/components'
import { WidgetTitleInput } from '@/components/builder/TitleInput'
import { WidgetDescriptionInput } from '@/components/builder/DescriptionInput'
import {
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText
} from '~/assets/svg'
import { useUIActions, useUIState } from '~/stores/uiStore'
import { toolState } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'
import { useMemo, useEffect } from 'react'

interface Props {
  onRefresh: (section: 'content' | 'appearance') => void
  onBuildStepComplete?: (isComplete: boolean) => void
}

const config = {
  suggestedTitles: [
    'Support this content',
    'Make a payment',
    'Contribute now',
    'Help support',
    'One-time donation'
  ],
  titleHelpText: 'Message to encourage one-time payments',
  titleMaxLength: 30,
  messageLabel: 'Widget message',
  messagePlaceholder: 'Enter your widget message...',
  messageHelpText: 'Describe how payments support your work',
  messageMaxLength: 300,

  showThumbnail: false,
  fontSizeRange: WIDGET_FONT_SIZES
}

export function WidgetBuilder({ onRefresh, onBuildStepComplete }: Props) {
  const uiState = useUIState()

  useEffect(() => {
    const bothComplete = uiState.contentComplete && uiState.appearanceComplete
    if (onBuildStepComplete) {
      onBuildStepComplete(bothComplete)
    }
  }, [uiState.contentComplete, uiState.appearanceComplete, onBuildStepComplete])

  return (
    <>
      <ContentBuilder onRefresh={onRefresh} />
      <AppearanceBuilder onRefresh={onRefresh} />
    </>
  )
}

function ContentBuilder({ onRefresh }: Props) {
  const uiActions = useUIActions()
  const uiState = useUIState()

  return (
    <BuilderAccordion
      title="Content"
      isComplete={uiState.contentComplete}
      onToggle={(isOpen) => {
        uiActions.setActiveSection(isOpen ? 'content' : null)
        if (isOpen) {
          uiActions.setContentComplete(true)
        }
      }}
      onRefresh={() => onRefresh('content')}
      onDone={() => {
        uiActions.setContentComplete(true)
      }}
      initialIsOpen={uiState.activeSection === 'content'}
    >
      <WidgetTitleInput
        onChange={(value) => (toolState.currentConfig.widgetTitleText = value)}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <WidgetDescriptionInput
        label={config.messageLabel}
        onChange={(text) =>
          (toolState.currentConfig.widgetDescriptionText = text)
        }
        onVisibilityChange={(visible) =>
          (toolState.currentConfig.widgetDescriptionVisible = visible)
        }
        maxLength={config.messageMaxLength}
        helpText={config.messageHelpText}
        placeholder={config.messagePlaceholder}
      />
    </BuilderAccordion>
  )
}

function AppearanceBuilder({ onRefresh }: Props) {
  const uiActions = useUIActions()
  const uiState = useUIState()

  return (
    <BuilderAccordion
      title="Appearance"
      isComplete={uiState.appearanceComplete}
      onToggle={(isOpen: boolean) => {
        uiActions.setActiveSection(isOpen ? 'appearance' : null)
        if (isOpen) {
          uiActions.setAppearanceComplete(true)
        }
      }}
      onRefresh={() => onRefresh('appearance')}
      onDone={() => {
        uiActions.setAppearanceComplete(true)
      }}
      initialIsOpen={uiState.activeSection === 'appearance'}
    >
      <div className="flex flex-col gap-xs">
        <SectionHeader icon={<SVGText className="w-5 h-5" />} label="Text" />
        <FontFamilySelector />
        <FontSizeSelector />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGColorPicker className="w-5 h-5" />}
          label="Colors"
        />
        <WidgetColorsSelector
          onBackgroundColorChange={(color: string) =>
            (toolState.currentConfig.widgetBackgroundColor = color)
          }
          onTextColorChange={(color: string) =>
            (toolState.currentConfig.widgetTextColor = color)
          }
          onButtonColorChange={(color: string) =>
            (toolState.currentConfig.widgetButtonBackgroundColor = color)
          }
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGRoundedCorner className="w-5 h-5" />}
          label="Container Corner Radius"
        />
        <BorderSelector />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGHeaderPosition className="w-5 h-5" />}
          label="Position"
        />
        <WidgetPositionSelector
          onChange={(value) => (toolState.currentConfig.widgetPosition = value)}
        />
      </div>
    </BuilderAccordion>
  )
}

function FontFamilySelector() {
  const {
    currentConfig: { widgetFontName }
  } = useSnapshot(toolState)
  const defaultFontIndex = useMemo(
    () => FONT_FAMILY_OPTIONS.findIndex((option) => option === widgetFontName),
    [widgetFontName]
  )

  return (
    <ToolsDropdown
      label="Font Family"
      defaultValue={defaultFontIndex.toString()}
      onChange={(value) => {
        const fontName = FONT_FAMILY_OPTIONS[parseInt(value)]
        toolState.currentConfig.widgetFontName = fontName
      }}
      options={FONT_FAMILY_OPTIONS.map((font, index) => ({
        label: font,
        value: index.toString()
      }))}
    />
  )
}

function FontSizeSelector() {
  // const widgetFontSize = useSnapshot(toolState.currentConfig).widgetFontSize
  const { widgetFontSize } = useSnapshot(toolState).currentConfig
  const { min: minFontSize, max: maxFontSize } = config.fontSizeRange

  return (
    <div className="flex flex-col gap-2xs">
      <label className="text-xs leading-xs text-silver-700">Size</label>
      <div className="flex items-center h-12 gap-md">
        <Slider
          min={minFontSize}
          max={maxFontSize}
          value={widgetFontSize}
          onChange={(value) => {
            toolState.currentConfig.widgetFontSize = value
          }}
        />
      </div>
    </div>
  )
}

function BorderSelector() {
  // const widgetButtonBorder = useSnapshot(
  //   toolState.currentConfig
  // ).widgetButtonBorder
  const { widgetButtonBorder } = useSnapshot(toolState).currentConfig

  return (
    <CornerRadiusSelector
      defaultValue={widgetButtonBorder}
      onChange={(value) => (toolState.currentConfig.widgetButtonBorder = value)}
    />
  )
}
