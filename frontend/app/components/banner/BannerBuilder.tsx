import {
  BANNER_FONT_SIZES,
  FONT_FAMILY_OPTIONS,
  SLIDE_ANIMATION,
  type SlideAnimationType
} from '@shared/types'
import {
  BannerPositionSelector,
  BannerColorsSelector,
  BuilderAccordion,
  Divider,
  Checkbox,
  ToolsDropdown,
  SectionHeader,
  CornerRadiusSelector,
  Thumbnail,
  Slider
} from '@/components'
import { BannerTitleInput } from '@/components/builder/TitleInput'
import { BannerDescriptionInput } from '@/components/builder/DescriptionInput'
import { useUIActions, useUIState } from '~/stores/uiStore'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail
} from '~/assets/svg'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'
import { useState, useEffect, useMemo } from 'react'
import { toolState } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'

interface Props {
  onRefresh: (section: 'content' | 'appearance') => void
  onBuildStepComplete?: (isComplete: boolean) => void
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

export function BannerBuilder({ onRefresh, onBuildStepComplete }: Props) {
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
  const uiState = useUIState()
  const uiActions = useUIActions()

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
      <BannerTitleInput
        onChange={(value) => (toolState.currentConfig.bannerTitleText = value)}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <BannerDescriptionInput
        label={config.messageLabel}
        onChange={(text) =>
          (toolState.currentConfig.bannerDescriptionText = text)
        }
        onVisibilityChange={(visible) =>
          (toolState.currentConfig.bannerDescriptionVisible = visible)
        }
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
        <BannerColorsSelector
          onBackgroundColorChange={(color: string) =>
            (toolState.currentConfig.bannerBackgroundColor = color)
          }
          onTextColorChange={(color: string) =>
            (toolState.currentConfig.bannerTextColor = color)
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
        <BannerPositionSelector
          onChange={(value) => (toolState.currentConfig.bannerPosition = value)}
        />
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGAnimation className="w-5 h-5" />}
          label="Animation"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <AnimationSelector />
        </div>
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGThumbnail className="w-5 h-5" />}
          label="Thumbnail"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <ThumbnailSelector />
        </div>
      </div>
    </BuilderAccordion>
  )
}

function FontFamilySelector() {
  const {
    currentConfig: { bannerFontName }
  } = useSnapshot(toolState)
  const defaultFontIndex = useMemo(
    () => FONT_FAMILY_OPTIONS.findIndex((option) => option === bannerFontName),
    [bannerFontName]
  )

  return (
    <ToolsDropdown
      label="Font Family"
      defaultValue={defaultFontIndex.toString()}
      onChange={(value) => {
        const fontName = FONT_FAMILY_OPTIONS[parseInt(value)]
        toolState.currentConfig.bannerFontName = fontName
      }}
      options={FONT_FAMILY_OPTIONS.map((font, index) => ({
        label: font,
        value: index.toString()
      }))}
    />
  )
}

function FontSizeSelector() {
  const {
    currentConfig: { bannerFontSize }
  } = useSnapshot(toolState)
  const { min: minFontSize, max: maxFontSize } = config.fontSizeRange

  return (
    <div className="flex flex-col gap-2xs">
      <label className="text-xs leading-xs text-silver-700">Size</label>
      <div className="flex items-center h-12 gap-md">
        <Slider
          value={bannerFontSize}
          min={minFontSize}
          max={maxFontSize}
          onChange={(value) => (toolState.currentConfig.bannerFontSize = value)}
        />
      </div>
    </div>
  )
}

function BorderSelector() {
  const {
    currentConfig: { bannerBorder }
  } = useSnapshot(toolState)

  return (
    <CornerRadiusSelector
      defaultValue={bannerBorder}
      onChange={(value) => (toolState.currentConfig.bannerBorder = value)}
    />
  )
}

function AnimationSelector() {
  const snap = useSnapshot(toolState.currentConfig)
  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(() => {
      const validated = getValidSlideAnimation(snap.bannerSlideAnimation)
      return validated === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : validated
    })

  const [isAnimated, setIsAnimated] = useState(
    () => snap.bannerSlideAnimation !== SLIDE_ANIMATION.None
  )

  useEffect(() => {
    setIsAnimated(snap.bannerSlideAnimation !== SLIDE_ANIMATION.None)
  }, [snap.bannerSlideAnimation])

  return (
    <>
      <Checkbox
        checked={isAnimated}
        onChange={(visible) => {
          setIsAnimated(visible)
          toolState.currentConfig.bannerSlideAnimation = visible
            ? lastSelectedAnimation
            : SLIDE_ANIMATION.None
        }}
        label="Animated"
      />
      <div className="flex-1 w-full xl:w-auto">
        <ToolsDropdown
          label="Type"
          disabled={!isAnimated}
          defaultValue={
            isAnimated
              ? getValidSlideAnimation(
                  toolState.currentConfig.bannerSlideAnimation
                )
              : lastSelectedAnimation
          }
          options={[
            { label: 'Slide', value: SLIDE_ANIMATION.Slide },
            { label: 'Fade-in', value: SLIDE_ANIMATION.FadeIn }
          ]}
          onChange={(value) => {
            const selectedAnimation = value as SlideAnimationType
            setLastSelectedAnimation(selectedAnimation)
            toolState.currentConfig.bannerSlideAnimation = selectedAnimation
          }}
        />
      </div>
    </>
  )
}

function ThumbnailSelector() {
  const snap = useSnapshot(toolState.currentConfig)
  const [isThumbnailVisible, setIsThumbnailVisible] = useState(() =>
    Boolean(snap.bannerThumbnail)
  )

  useEffect(() => {
    setIsThumbnailVisible(Boolean(snap.bannerThumbnail))
  }, [snap.bannerThumbnail])

  const thumbnails = [wmLogo]

  return (
    <>
      <Checkbox
        checked={isThumbnailVisible}
        onChange={(visible) => {
          setIsThumbnailVisible(visible)
          toolState.currentConfig.bannerThumbnail = visible ? 'default' : ''
        }}
        label="Visible"
      />
      <div className="flex gap-md">
        {thumbnails.map((thumbnail, index) => (
          <Thumbnail
            key={index}
            isSelected={true}
            imageUrl={thumbnail}
            onClick={() => {}}
          />
        ))}
      </div>
    </>
  )
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}
