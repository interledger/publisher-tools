import {
  BANNER_FONT_SIZES,
  FONT_FAMILY_OPTIONS,
  SLIDE_ANIMATION,
  type SlideAnimationType,
  type BannerConfig
} from '@shared/types'
import {
  BannerColorsSelector,
  Divider,
  Checkbox,
  ToolsDropdown,
  CornerRadiusSelector,
  Thumbnail
} from '@/components'
import { useUI } from '~/stores/uiStore'
import BuilderAccordion from '@/components/BuilderAccordion'
import { InputFieldset } from '@/components/builder/InputFieldset'
import { TitleInput } from '@/components/builder/TitleInput'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import { BannerPositionSelector } from '~/components/banner/BannerPositionSelector'
import { BannerAnimationSelector } from '~/components/banner/BannerAnimationSelector'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail
} from '~/assets/svg'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'
import { useState } from 'react'
import { toolState } from '~/stores/toolStore'

interface Props {
  onRefresh: (section: 'content' | 'appearance') => void
}

const config = {
  suggestedTitles: [
    'How to support?',
    'Fund me',
    'Pay as you browse',
    'Easy donate',
    'Support my work'
  ],
  titleHelpText: 'Strong message to help people engage with Web Monetization',
  titleMaxLength: 60,
  messageLabel: 'Banner message',
  messagePlaceholder: 'Enter your banner message...',
  messageHelpText: 'Strong message to help people engage with Web Monetization',
  messageMaxLength: 300,

  showThumbnail: true,
  fontSizeRange: BANNER_FONT_SIZES
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
  const { actions: uiActions, state: uiState } = useUI()
  const profile = toolState.currentConfig as BannerConfig

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
        value={profile.bannerTitleText}
        onChange={(value) => (profile.bannerTitleText = value)}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <DescriptionInput
        label={config.messageLabel}
        value={profile.bannerDescriptionText}
        onChange={(text) => (profile.bannerDescriptionText = text)}
        isVisible={profile.bannerDescriptionVisible}
        onVisibilityChange={(visible) =>
          (profile.bannerDescriptionVisible = visible)
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
  const profile = toolState.currentConfig as BannerConfig

  const thumbnails = [wmLogo]

  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === profile.bannerFontName
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
            profile.bannerFontName = fontName
          }}
          options={FONT_FAMILY_OPTIONS.map((font, index) => ({
            label: font,
            value: index.toString()
          }))}
        />

        <FontSizeInput
          value={profile.bannerFontSize}
          onChange={(value) => (profile.bannerFontSize = value)}
          min={config.fontSizeRange.min}
          max={config.fontSizeRange.max}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Colors"
        icon={<SVGColorPicker className="w-5 h-5" />}
      >
        <BannerColorsSelector
          backgroundColor={profile.bannerBackgroundColor}
          textColor={profile.bannerTextColor}
          onBackgroundColorChange={(color: string) =>
            (profile.bannerBackgroundColor = color)
          }
          onTextColorChange={(color: string) =>
            (profile.bannerTextColor = color)
          }
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Container Corner Radius"
        icon={<SVGRoundedCorner className="w-5 h-5" />}
      >
        <CornerRadiusSelector
          value={profile.bannerBorder}
          onChange={(value) => (profile.bannerBorder = value)}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Position"
        icon={<SVGHeaderPosition className="w-5 h-5" />}
      >
        <BannerPositionSelector
          value={profile.bannerPosition}
          onChange={(value) => (profile.bannerPosition = value)}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Animation"
        icon={<SVGAnimation className="w-5 h-5" />}
      >
        <BannerAnimationSelector
          value={profile.bannerSlideAnimation}
          onChange={(value) => (profile.bannerSlideAnimation = value)}
        />
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Thumbnail"
        icon={<SVGThumbnail className="w-5 h-5" />}
      >
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <Checkbox
            checked={
              typeof profile.bannerThumbnail === 'undefined' ||
              !!profile.bannerThumbnail
            }
            onChange={(visible) => {
              profile.bannerThumbnail = visible ? 'default' : ''
            }}
            label="Visible"
          />
          <div className="flex gap-md">
            {thumbnails.map((thumbnail, index) => (
              <Thumbnail
                key={index}
                isSelected={selectedThumbnail === index}
                imageUrl={thumbnail}
                onClick={() => setSelectedThumbnail(index)}
              />
            ))}
          </div>
        </div>
      </InputFieldset>
    </BuilderAccordion>
  )
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}
