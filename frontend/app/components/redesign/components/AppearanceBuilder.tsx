import React, { useState } from 'react'
import { cx } from 'class-variance-authority'
import { useUI } from '~/stores/uiStore'
import { SectionHeader } from './SectionHeader'
import { BuilderAccordion } from './BuilderAccordion'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail
} from '@/assets'
import {
  Thumbnail,
  ToolsDropdown,
  CornerRadiusSelector,
  Divider,
  Slider,
  Checkbox
} from '@/components'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'
import {
  type CornerType,
  type BannerPositionKey,
  type WidgetPositionKey,
  type FontFamilyKey,
  type SlideAnimationType,
  FONT_FAMILY_OPTIONS,
  SLIDE_ANIMATION
} from '@shared/types'

export interface AppearanceConfig {
  showThumbnail: boolean
  fontSizeRange: { min: number; max: number; default: number }
}

interface BaseToolAppearance {
  fontName?: FontFamilyKey
  fontSize?: number
  backgroundColor?: string
  textColor?: string
  buttonColor?: string
  borderRadius?: CornerType
  slideAnimation?: SlideAnimationType
  thumbnail?: string

  onFontNameChange: (fontName: FontFamilyKey) => void
  onFontSizeChange: (fontSize: number) => void
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onButtonColorChange?: (color: string) => void
  onBorderChange: (border: CornerType) => void
  onSlideAnimationChange: (animation: SlideAnimationType) => void
  onThumbnailVisibilityChange: (visible: boolean) => void

  showAnimation?: boolean
}

export interface BannerToolAppearance extends BaseToolAppearance {
  position?: BannerPositionKey
  onPositionChange: (position: BannerPositionKey) => void
}

export interface WidgetToolAppearance extends BaseToolAppearance {
  position?: WidgetPositionKey
  onPositionChange: (position: WidgetPositionKey) => void
}

export type ToolAppearance = BannerToolAppearance | WidgetToolAppearance

interface AppearanceBuilderProps {
  profile: ToolAppearance
  config: AppearanceConfig
  onRefresh: () => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}

export const AppearanceBuilder: React.FC<AppearanceBuilderProps> = ({
  profile,
  config,
  onRefresh,
  positionSelector,
  colorsSelector
}) => {
  const { min: minFontSize, max: maxFontSize } = config.fontSizeRange

  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const { actions: uiActions, state: uiState } = useUI()
  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(() => {
      const validated = getValidSlideAnimation(profile.slideAnimation)
      return validated === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : validated
    })
  const isAnimated = profile.slideAnimation !== SLIDE_ANIMATION.None

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === profile.fontName
  )
  const thumbnails = [wmLogo]

  const handleToggle = (isOpen: boolean) => {
    uiActions.setActiveSection(isOpen ? 'appearance' : null)
    if (isOpen) {
      uiActions.setAppearanceComplete(true)
    }
  }

  return (
    <BuilderAccordion
      title="Appearance"
      isComplete={uiState.appearanceComplete}
      onToggle={handleToggle}
      onRefresh={onRefresh}
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
            profile.onFontNameChange(fontName)
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
                  (profile.fontSize ?? minFontSize) - 1
                )
                profile.onFontSizeChange(newSize)
              }}
              aria-label="Decrease font size"
            >
              <span className="text-sm leading-sm text-text-primary">A</span>
            </button>

            <Slider
              value={profile.fontSize ?? minFontSize}
              min={minFontSize}
              max={maxFontSize}
              onChange={(value) => {
                console.log('Font size changed to:', value)
                profile.onFontSizeChange(value)
              }}
            />

            <button
              className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
              onClick={() => {
                const newSize = Math.min(
                  maxFontSize,
                  (profile.fontSize ?? minFontSize) + 1
                )
                profile.onFontSizeChange(newSize)
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
        {colorsSelector}
      </div>
      <Divider />

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGRoundedCorner className="w-5 h-5" />}
          label="Container Corner Radius"
        />
        <CornerRadiusSelector
          defaultValue={profile.borderRadius}
          onChange={(value) => profile.onBorderChange(value)}
        />
      </div>

      {positionSelector && (
        <>
          <Divider />
          <div className="flex flex-col gap-xs">
            <SectionHeader
              icon={<SVGHeaderPosition className="w-5 h-5" />}
              label="Position"
            />
            {positionSelector}
          </div>
        </>
      )}

      {profile.showAnimation && (
        <>
          <Divider />
          <div className="flex flex-col gap-xs">
            <SectionHeader
              icon={<SVGAnimation className="w-5 h-5" />}
              label="Animation"
            />
            <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
              <Checkbox
                checked={isAnimated}
                onChange={() => {
                  profile.onSlideAnimationChange(
                    isAnimated ? SLIDE_ANIMATION.None : lastSelectedAnimation
                  )
                }}
                label="Animated"
              />
              <div className="flex-1 w-full xl:w-auto">
                <ToolsDropdown
                  label="Type"
                  disabled={!isAnimated}
                  defaultValue={
                    isAnimated
                      ? getValidSlideAnimation(profile.slideAnimation)
                      : lastSelectedAnimation
                  }
                  options={[
                    { label: 'Slide', value: SLIDE_ANIMATION.Slide },
                    { label: 'Fade-in', value: SLIDE_ANIMATION.FadeIn }
                  ]}
                  onChange={(value) => {
                    const selectedAnimation = value as SlideAnimationType
                    setLastSelectedAnimation(selectedAnimation)
                    profile.onSlideAnimationChange(selectedAnimation)
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={cx(config.showThumbnail ? 'flex flex-col gap-xs' : 'hidden')}
      >
        <Divider />
        <SectionHeader
          icon={<SVGThumbnail className="w-5 h-5" />}
          label="Thumbnail"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <Checkbox
            checked={
              typeof profile.thumbnail === 'undefined' || !!profile.thumbnail
            }
            onChange={profile.onThumbnailVisibilityChange}
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

export default AppearanceBuilder
