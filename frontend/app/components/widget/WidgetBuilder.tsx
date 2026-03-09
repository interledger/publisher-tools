import {
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
  WidgetColorsSelector,
} from '@/components'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import { InputFieldset } from '@/components/builder/InputFieldset'
import { TitleInput } from '@/components/builder/TitleInput'
import BuilderAccordion from '@/components/BuilderAccordion'
import { FONT_FAMILY_OPTIONS, WIDGET_FONT_SIZE_MAP } from '@shared/types'
import {
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
} from '~/assets/svg'
import { WidgetPositionSelector } from '~/components/widget/WidgetPositionSelector'
import { useBuilderSectionHandlers } from '~/hooks/useBuilderSectionHandlers'
import type { BuilderSection } from '~/stores/uiStore'
import { useWidgetProfile } from '~/stores/widget-store'

interface Props {
  onRefresh: (section: BuilderSection) => void
}

const config = {
  suggestedTitles: [
    'Support this content',
    'Make a payment',
    'Contribute now',
    'Help support',
    'One-time donation',
  ],
  titleHelpText: 'Message to encourage one-time payments',
  titleMaxLength: 30,
  messageLabel: 'Widget message',
  messagePlaceholder: 'Enter your widget message...',
  messageHelpText: 'Describe how payments support your work',
  messageMaxLength: 300,

  showThumbnail: false,
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
  const { isComplete, isOpen, onClick, onToggle, onDone } =
    useBuilderSectionHandlers('content')
  const [snap, profile] = useWidgetProfile({ sync: true })

  return (
    <BuilderAccordion
      title="Content"
      isComplete={isComplete}
      isOpen={isOpen}
      onClick={onClick}
      onToggle={onToggle}
      onRefresh={() => onRefresh('content')}
      onDone={onDone}
    >
      <TitleInput
        value={snap.title.text}
        onChange={(value) => {
          profile.title.text = value
        }}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <DescriptionInput
        label={config.messageLabel}
        value={snap.description.text}
        onChange={(text) => {
          profile.description.text = text
        }}
        isVisible={snap.description.isVisible}
        onVisibilityChange={(visible) => {
          profile.description.isVisible = visible
        }}
        placeholder={config.messagePlaceholder}
        helpText={config.messageHelpText}
        maxLength={config.messageMaxLength}
      />
    </BuilderAccordion>
  )
}

function AppearanceBuilder({ onRefresh }: Props) {
  const { isComplete, isOpen, onClick, onToggle, onDone } =
    useBuilderSectionHandlers('appearance')
  const [snap, profile] = useWidgetProfile()

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === snap.font.name,
  )

  return (
    <BuilderAccordion
      title="Appearance"
      isComplete={isComplete}
      isOpen={isOpen}
      onClick={onClick}
      onToggle={onToggle}
      onRefresh={() => onRefresh('appearance')}
      onDone={onDone}
    >
      <InputFieldset label="Text" icon={<SVGText className="w-5 h-5" />}>
        <ToolsDropdown
          label="Font Family"
          defaultValue={defaultFontIndex.toString()}
          onChange={(value) => {
            const fontName = FONT_FAMILY_OPTIONS[parseInt(value)]
            profile.font.name = fontName
          }}
          options={FONT_FAMILY_OPTIONS.map((font, index) => ({
            label: font,
            value: index.toString(),
          }))}
        />

        <FontSizeInput
          value={snap.font.size}
          onChange={(value) => {
            profile.font.size = value
          }}
          sizeMap={WIDGET_FONT_SIZE_MAP}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Colors"
        icon={<SVGColorPicker className="w-5 h-5" />}
      >
        <WidgetColorsSelector
          backgroundColor={snap.color.background}
          onBackgroundColorChange={(color) => {
            profile.color.background = color
          }}
          textColor={snap.color.text}
          onTextColorChange={(color) => {
            profile.color.text = color
          }}
          themeColor={snap.color.theme}
          onThemeColorChange={(color) => {
            profile.color.theme = color
          }}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Container Corner Radius"
        icon={<SVGRoundedCorner className="w-5 h-5" />}
      >
        <CornerRadiusSelector
          value={snap.border.type}
          onChange={(value) => {
            profile.border.type = value
          }}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Position"
        icon={<SVGHeaderPosition className="w-5 h-5" />}
      >
        <WidgetPositionSelector
          value={snap.position}
          onChange={(value) => {
            profile.position = value
          }}
        />
      </InputFieldset>
    </BuilderAccordion>
  )
}
