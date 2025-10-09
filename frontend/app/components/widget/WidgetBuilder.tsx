import {
  FONT_FAMILY_OPTIONS,
  WIDGET_FONT_SIZES,
  type WidgetConfig
} from '@shared/types'
import {
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
  WidgetPositionSelector,
  WidgetColorsSelector
} from '@/components'
import { useUI } from '~/stores/uiStore'
import BuilderAccordion from '@/components/BuilderAccordion'
import { SectionHeader } from '@/components/SectionHeader'
import { TitleInput } from '@/components/builder/TitleInput'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import {
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText
} from '~/assets/svg'
import { toolState } from '~/stores/toolStore'

interface Props {
  onRefresh: (section: 'content' | 'appearance') => void
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

export function WidgetBuilder({ onRefresh }: Props) {
  return (
    <>
      <ContentBuilder onRefresh={onRefresh} />
      <AppearanceBuilder onRefresh={onRefresh} />
    </>
  )
}

function ContentBuilder({ onRefresh }: Props) {
  const { actions: uiActions, state: uiState } = useUI()
  const profile = toolState.currentConfig as WidgetConfig

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
      <TitleInput
        value={profile.widgetTitleText}
        onChange={(value) => (profile.widgetTitleText = value)}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <DescriptionInput
        label={config.messageLabel}
        value={profile.widgetDescriptionText}
        onChange={(text) => (profile.widgetDescriptionText = text)}
        isVisible={profile.widgetDescriptionVisible}
        onVisibilityChange={(visible) =>
          (profile.widgetDescriptionVisible = visible)
        }
        placeholder={config.messagePlaceholder}
        helpText={config.messageHelpText}
        maxLength={config.messageMaxLength}
      />
    </BuilderAccordion>
  )
}

function AppearanceBuilder({ onRefresh }: Props) {
  const { actions: uiActions, state: uiState } = useUI()
  const profile = toolState.currentConfig as WidgetConfig

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === profile.widgetFontName
  )

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
        <ToolsDropdown
          label="Font Family"
          defaultValue={defaultFontIndex.toString()}
          onChange={(value) => {
            const fontName = FONT_FAMILY_OPTIONS[parseInt(value)]
            profile.widgetFontName = fontName
          }}
          options={FONT_FAMILY_OPTIONS.map((font, index) => ({
            label: font,
            value: index.toString()
          }))}
        />

        <FontSizeInput
          value={profile.widgetFontSize}
          onChange={(value) => (profile.widgetFontSize = value)}
          min={config.fontSizeRange.min}
          max={config.fontSizeRange.max}
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGColorPicker className="w-5 h-5" />}
          label="Colors"
        />
        <WidgetColorsSelector
          backgroundColor={profile.widgetBackgroundColor}
          onBackgroundColorChange={(color: string) =>
            (profile.widgetBackgroundColor = color)
          }
          textColor={profile.widgetTextColor}
          onTextColorChange={(color: string) =>
            (profile.widgetTextColor = color)
          }
          buttonColor={profile.widgetButtonBackgroundColor}
          onButtonColorChange={(color: string) =>
            (profile.widgetButtonBackgroundColor = color)
          }
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGRoundedCorner className="w-5 h-5" />}
          label="Container Corner Radius"
        />
        <CornerRadiusSelector
          defaultValue={profile.widgetButtonBorder}
          onChange={(value) => (profile.widgetButtonBorder = value)}
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGHeaderPosition className="w-5 h-5" />}
          label="Position"
        />
        <WidgetPositionSelector
          defaultValue={profile.widgetPosition}
          onChange={(value) => (profile.widgetPosition = value)}
        />
      </div>
    </BuilderAccordion>
  )
}
