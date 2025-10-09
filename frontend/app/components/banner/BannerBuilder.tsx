import {
  BANNER_FONT_SIZES,
  FONT_FAMILY_OPTIONS,
  SLIDE_ANIMATION,
  type SlideAnimationType,
  type BannerConfig
} from '@shared/types'
import {
  BannerPositionSelector,
  BannerColorsSelector,
  Divider,
  Checkbox,
  ToolsDropdown,
  CornerRadiusSelector,
  Thumbnail
} from '@/components'
import type { ContentConfig } from '~/components/redesign/components/ContentBuilder'
import type { AppearanceConfig } from '~/components/redesign/components/AppearanceBuilder'
import { useUI } from '~/stores/uiStore'
import BuilderAccordion from '@/components/BuilderAccordion'
import { SectionHeader } from '@/components/SectionHeader'
import { TitleInput } from '@/components/builder/TitleInput'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
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

const config: ContentConfig & AppearanceConfig = {
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

  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(() => {
      const validated = getValidSlideAnimation(profile.bannerSlideAnimation)
      return validated === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : validated
    })
  const isAnimated = profile.bannerSlideAnimation !== SLIDE_ANIMATION.None

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
      <div className="flex flex-col gap-xs">
        <SectionHeader icon={<SVGText className="w-5 h-5" />} label="Text" />
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
      </div>
      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGColorPicker className="w-5 h-5" />}
          label="Colors"
        />
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
      </div>
      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGRoundedCorner className="w-5 h-5" />}
          label="Container Corner Radius"
        />
        <CornerRadiusSelector
          defaultValue={profile.bannerBorder}
          onChange={(value) => (profile.bannerBorder = value)}
        />
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGHeaderPosition className="w-5 h-5" />}
          label="Position"
        />
        <BannerPositionSelector
          defaultValue={profile.bannerPosition}
          onChange={(value) => (profile.bannerPosition = value)}
        />
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGAnimation className="w-5 h-5" />}
          label="Animation"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <Checkbox
            checked={profile.bannerSlideAnimation !== SLIDE_ANIMATION.None}
            onChange={() => {
              profile.bannerSlideAnimation = isAnimated
                ? SLIDE_ANIMATION.None
                : lastSelectedAnimation
            }}
            label="Animated"
          />
          <div className="flex-1 w-full xl:w-auto">
            <ToolsDropdown
              label="Type"
              disabled={!isAnimated}
              defaultValue={
                isAnimated
                  ? getValidSlideAnimation(profile.bannerSlideAnimation)
                  : lastSelectedAnimation
              }
              options={[
                { label: 'Slide', value: SLIDE_ANIMATION.Slide },
                { label: 'Fade-in', value: SLIDE_ANIMATION.FadeIn }
              ]}
              onChange={(value) => {
                const selectedAnimation = value as SlideAnimationType
                setLastSelectedAnimation(selectedAnimation)
                profile.bannerSlideAnimation = selectedAnimation
              }}
            />
          </div>
        </div>
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGThumbnail className="w-5 h-5" />}
          label="Thumbnail"
        />
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
      </div>
    </BuilderAccordion>
  )
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}
