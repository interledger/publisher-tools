import {
  FONT_FAMILY_OPTIONS,
  WIDGET_FONT_SIZES,
  type WidgetConfig
} from '@shared/types'
import {
  Divider,
  ToolsDropdown,
  Slider,
  CornerRadiusSelector,
  WidgetPositionSelector,
  WidgetColorsSelector
} from '@/components'
import type { ContentConfig } from '~/components/redesign/components/ContentBuilder'
import type { AppearanceConfig } from '~/components/redesign/components/AppearanceBuilder'
import BuilderAccordion from '~/components/redesign/components/BuilderAccordion'
import { useUI } from '~/stores/uiStore'
import { TitleInput } from '~/components/redesign/components/builder/TitleInput'
import { DescriptionInput } from '~/components/redesign/components/builder/DescriptionInput'
import { SectionHeader } from '~/components/redesign/components/SectionHeader'
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

const config: ContentConfig & AppearanceConfig = {
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

  const { min: minFontSize, max: maxFontSize } = config.fontSizeRange

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

        <div className="flex flex-col gap-2xs">
          <label className="text-xs leading-xs text-silver-700">Size</label>
          <div className="flex items-center h-12 gap-md">
            <button
              className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
              onClick={() => {
                const newSize = Math.max(
                  minFontSize,
                  (profile.widgetFontSize ?? minFontSize) - 1
                )
                profile.widgetFontSize = newSize
              }}
              aria-label="Decrease font size"
            >
              <span className="text-sm leading-sm text-text-primary">A</span>
            </button>

            <Slider
              value={profile.widgetFontSize ?? minFontSize}
              min={minFontSize}
              max={maxFontSize}
              onChange={(value) => {
                console.log('Font size changed to:', value)
                profile.widgetFontSize = value
              }}
            />

            <button
              className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
              onClick={() => {
                const newSize = Math.min(
                  maxFontSize,
                  (profile.widgetFontSize ?? minFontSize) + 1
                )
                profile.widgetFontSize = newSize
              }}
            >
              <span className="text-3xl leading-3xl text-text-primary">A</span>
            </button>
          </div>
        </div>
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
