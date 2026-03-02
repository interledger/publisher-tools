import {
  BannerColorsSelector,
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
} from '@/components'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import { InputFieldset } from '@/components/builder/InputFieldset'
import { TitleInput } from '@/components/builder/TitleInput'
import BuilderAccordion from '@/components/BuilderAccordion'
import { BANNER_FONT_SIZE_MAP, FONT_FAMILY_OPTIONS } from '@shared/types'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail,
} from '~/assets/svg'
import { BannerAnimationSelector } from '~/components/banner/BannerAnimationSelector'
import { BannerPositionSelector } from '~/components/banner/BannerPositionSelector'
import { BannerThumbnailSelector } from '~/components/banner/BannerThumbnailSelector'
import { useBannerProfile } from '~/stores/banner-store'
import { useUIActions, useUIState } from '~/stores/uiStore'

interface Props {
  onRefresh: (section: 'content' | 'appearance') => void
}

const config = {
  suggestedTitles: [
    'How to support?',
    'Fund me',
    'Pay as you browse',
    'Easy donate',
    'Support my work',
  ],
  titleHelpText: 'Strong message to help people engage with Web Monetization',
  titleMaxLength: 60,
  messageLabel: 'Banner message',
  messagePlaceholder: 'Enter your banner message...',
  messageHelpText: 'Strong message to help people engage with Web Monetization',
  messageMaxLength: 300,

  showThumbnail: true,
}

export function BannerBuilder({ onRefresh }: Props) {
  return (
    <>
      <ContentBuilder onRefresh={onRefresh} />
      <AppearanceBuilder onRefresh={onRefresh} />
    </>
  )
}

function ContentBuilder({ onRefresh }: Props) {
  const uiState = useUIState()
  const uiActions = useUIActions()
  const [snap, profile] = useBannerProfile({ sync: true })

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
  const uiState = useUIState()
  const uiActions = useUIActions()
  const [snap, profile] = useBannerProfile()

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === snap.font.name,
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
          sizeMap={BANNER_FONT_SIZE_MAP}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Colors"
        icon={<SVGColorPicker className="w-5 h-5" />}
      >
        <BannerColorsSelector
          backgroundColor={snap.color.background}
          textColor={snap.color.text}
          onBackgroundColorChange={(color) => {
            profile.color.background = color
          }}
          onTextColorChange={(color) => {
            profile.color.text = color
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
        <BannerPositionSelector
          value={snap.position}
          onChange={(value) => {
            profile.position = value
          }}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Animation"
        icon={<SVGAnimation className="w-5 h-5" />}
      >
        <BannerAnimationSelector
          value={snap.animation.type}
          onChange={(value) => {
            profile.animation.type = value
          }}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Thumbnail"
        icon={<SVGThumbnail className="w-5 h-5" />}
      >
        <BannerThumbnailSelector
          value={snap.thumbnail.value}
          onChange={(value) => {
            profile.thumbnail.value = value
          }}
        />
      </InputFieldset>
    </BuilderAccordion>
  )
}
