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
  TextareaField,
  ToolsDropdown,
  Slider,
  CornerRadiusSelector,
  Thumbnail
} from '@/components'
import { BuilderForm } from '~/components/builder/BuilderForm'
import type { ContentConfig } from '~/components/redesign/components/ContentBuilder'
import type { AppearanceConfig } from '~/components/redesign/components/AppearanceBuilder'
import BuilderAccordion from '~/components/redesign/components/BuilderAccordion'
import { useUI } from '~/stores/uiStore'
import { TitleInput } from '~/components/redesign/components/builder/TitleInput'
import { SectionHeader } from '~/components/redesign/components/SectionHeader'
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

interface Props {
  profile: BannerConfig
  onRefresh: (section: 'content' | 'appearance') => void
  onComplete: (isComplete: boolean) => void
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

export function BannerBuilder({ profile, onRefresh, onComplete }: Props) {
  const { min: minFontSize, max: maxFontSize } = config.fontSizeRange
  const thumbnails = [wmLogo]
  const { actions: uiActions, state: uiState } = useUI()

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
    <BuilderForm onBuildStepComplete={onComplete}>
      <pre className="overflow-auto">{JSON.stringify(profile, null, 2)}</pre>

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
        <div className="flex flex-col gap-lg">
          <TitleInput
            value={profile.bannerTitleText}
            onChange={(value) => (profile.bannerTitleText = value)}
            suggestions={config.suggestedTitles}
            maxLength={config.titleMaxLength}
            helpText={config.titleHelpText}
          />

          <Divider />

          <div className="flex flex-col gap-xs">
            <h4 className="text-base leading-md font-bold text-text-primary">
              {config.messageLabel}
            </h4>
            <div className="flex gap-lg items-start xl:flex-row flex-col">
              <div className="flex items-center gap-xs shrink-0">
                <Checkbox
                  checked={profile.bannerDescriptionVisible}
                  onChange={(visible) => {
                    profile.bannerDescriptionVisible = visible
                  }}
                  label="Visible"
                />
              </div>

              <div className="flex-grow w-full">
                <TextareaField
                  // ref={messageTextareaRef}
                  defaultValue={profile.bannerDescriptionText}
                  onChange={(e) => {
                    profile.bannerDescriptionText = e.target.value
                  }}
                  currentLength={profile.bannerDescriptionText.length || 0}
                  maxLength={config.messageMaxLength}
                  showCounter={true}
                  helpText={config.messageHelpText}
                  className="h-[84px]"
                  placeholder={config.messagePlaceholder}
                  disabled={!profile.bannerDescriptionVisible}
                />
              </div>
            </div>
          </div>
        </div>
      </BuilderAccordion>

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

          <div className="flex flex-col gap-2xs">
            <label className="text-xs leading-xs text-silver-700">Size</label>
            <div className="flex items-center h-12 gap-md">
              <button
                className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
                onClick={() => {
                  const newSize = Math.max(
                    minFontSize,
                    (profile.bannerFontSize ?? minFontSize) - 1
                  )
                  profile.bannerFontSize = newSize
                }}
                aria-label="Decrease font size"
              >
                <span className="text-sm leading-sm text-text-primary">A</span>
              </button>

              <Slider
                value={profile.bannerFontSize ?? minFontSize}
                min={minFontSize}
                max={maxFontSize}
                onChange={(value) => {
                  console.log('Font size changed to:', value)
                  profile.bannerFontSize = value
                }}
              />

              <button
                className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
                onClick={() => {
                  const newSize = Math.min(
                    maxFontSize,
                    (profile.bannerFontSize ?? minFontSize) + 1
                  )
                  profile.bannerFontSize = newSize
                }}
              >
                <span className="text-3xl leading-3xl text-text-primary">
                  A
                </span>
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

        <div className="flex flex-col gap-xs">
          <Divider />
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
    </BuilderForm>
  )
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}
