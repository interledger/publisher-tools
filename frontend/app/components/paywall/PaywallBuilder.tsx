import {
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
  TitleInput,
  TextareaField,
} from '@/components'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import { InputFieldset } from '@/components/builder/InputFieldset'
import { CustomTitle } from '@/components/builder/TitleInput'
import { BuilderAccordion } from '@/components/BuilderAccordion'
import {
  FONT_FAMILY_OPTIONS,
  PAYWALL_CTA_BUTTON_MAX_LENGTH,
  PAYWALL_DESCRIPTION_MAX_LENGTH,
  PAYWALL_FONT_SIZE_MAP,
  PAYWALL_TITLE_MAX_LENGTH,
} from '@shared/types'
import { SVGColorPicker, SVGRoundedCorner, SVGText } from '~/assets/svg'
import { useBuilderSectionHandlers } from '~/hooks/useBuilderSectionHandlers'
import { PAYWALL_SUGGESTED_TITLES } from '~/lib/presets'
import { usePaywallProfile, useSectionHasChanges } from '~/stores/paywall-store'
import type { BuilderSection } from '~/stores/uiStore'
import { PaywallColorsSelector } from './PaywallColorsSelector'

interface Props {
  onRefresh: (section: BuilderSection) => void
}

const config = {
  suggestedTitles: PAYWALL_SUGGESTED_TITLES,
  titleHelpText: 'Short and direct works best.',
  titleMaxLength: PAYWALL_TITLE_MAX_LENGTH,

  messageLabel: 'Subtitle',
  messagePlaceholder: `Unlock the full article with a one-time payment — no subscription, no account.`,
  messageHelpText: 'Explain the value in one sentence.',
  messageMaxLength: PAYWALL_DESCRIPTION_MAX_LENGTH,

  buttonLabel: 'Pay button label',
  buttonPlaceholder: 'Pay with Open Payments',
  buttonMaxLength: PAYWALL_CTA_BUTTON_MAX_LENGTH,
}

export function PaywallBuilder({ onRefresh }: Props) {
  return (
    <>
      <ContentBuilder onRefresh={onRefresh} />
      <AppearanceBuilder onRefresh={onRefresh} />
    </>
  )
}

function ContentBuilder({ onRefresh }: Props) {
  const { isOpen, onClick, onToggle, onDone } =
    useBuilderSectionHandlers('content')
  const hasChanges = useSectionHasChanges('content')
  const [snap, profile] = usePaywallProfile({ sync: true })

  return (
    <BuilderAccordion
      title="Content"
      hasChanges={hasChanges}
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

      <TextareaField
        value={snap.description.text}
        onChange={(e) => {
          profile.description.text = e.target.value
        }}
        currentLength={snap.description.text.length || 0}
        showCounter={true}
        label={
          <span className="text-base leading-md font-bold text-text-primary">
            {config.messageLabel}
          </span>
        }
        placeholder={config.messagePlaceholder}
        helpText={config.messageHelpText}
        maxLength={config.messageMaxLength}
        className="h-16"
      />

      <Divider />

      <CustomTitle
        value={snap.ctaButton.text}
        onChange={(value) => {
          profile.ctaButton.text = value
        }}
        label={config.buttonLabel}
        placeholder={config.buttonPlaceholder}
        maxLength={config.buttonMaxLength}
        helpText={''}
        id="input-pay-button"
      />
    </BuilderAccordion>
  )
}

function AppearanceBuilder({ onRefresh }: Props) {
  const { isOpen, onClick, onToggle, onDone } =
    useBuilderSectionHandlers('appearance')
  const hasChanges = useSectionHasChanges('appearance')
  const [snap, profile] = usePaywallProfile()

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === snap.font.name,
  )

  return (
    <BuilderAccordion
      title="Appearance"
      hasChanges={hasChanges}
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
          sizeMap={PAYWALL_FONT_SIZE_MAP}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Colors"
        icon={<SVGColorPicker className="w-5 h-5" />}
      >
        <PaywallColorsSelector
          backgroundColor={snap.colors.background}
          textColor={snap.colors.text}
          themeColor={snap.colors.theme}
          onBackgroundColorChange={(color) => {
            profile.colors.background = color
          }}
          onTextColorChange={(color) => {
            profile.colors.text = color
          }}
          onThemeColorChange={(color) => {
            profile.colors.theme = color
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
    </BuilderAccordion>
  )
}
