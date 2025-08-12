import React, { useState } from 'react'
import { SectionHeader } from './SectionHeader'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail,
  SVGRefresh,
  SVGArrowCollapse,
  SVGGreenVector
} from '@/assets'
import {
  Thumbnail,
  ToolsSecondaryButton,
  ToolsDropdown,
  CornerRadiusSelector,
  Divider,
  Slider,
  Checkbox
} from '@/components'
import { Heading5 } from '@/typography'
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

interface BaseToolAppearance {
  fontName?: FontFamilyKey
  fontSize?: number
  backgroundColor?: string
  textColor?: string
  buttonColor?: string
  borderRadius?: CornerType
  slideAnimation?: SlideAnimationType

  onFontNameChange: (fontName: FontFamilyKey) => void
  onFontSizeChange: (fontSize: number) => void
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onButtonColorChange?: (color: string) => void
  onBorderChange: (border: CornerType) => void
  onSlideAnimationChange: (animation: SlideAnimationType) => void

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
  appearance: ToolAppearance
  isComplete?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  onDone?: () => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
  activeVersion?: string
}

export const AppearanceBuilder: React.FC<AppearanceBuilderProps> = ({
  appearance,
  isComplete,
  isExpanded = false,
  onToggle,
  onDone,
  positionSelector,
  colorsSelector,
  activeVersion
}) => {
  const minFontSize = 12
  const maxFontSize = 20
  const [isThumbnailVisible, setIsThumbnailVisible] = useState(true)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(
      appearance.slideAnimation === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : appearance.slideAnimation || SLIDE_ANIMATION.Slide
    )
  const isAnimated = appearance.slideAnimation !== SLIDE_ANIMATION.None

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === appearance.fontName
  )
  const thumbnails = [wmLogo]

  const toggleExpand = () => {
    if (onToggle) {
      onToggle()
    }
  }

  const handleDoneClick = () => {
    if (onToggle) {
      onToggle()
    }
    if (onDone) {
      onDone()
    }
  }

  if (!isExpanded) {
    return (
      <div
        className="bg-interface-bg-main rounded-lg cursor-pointer"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        aria-label="Expand appearance section"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpand()
          }
        }}
      >
        <div className="px-4 pr-1 py-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isComplete && <SVGGreenVector className="w-6 h-[18px]" />}
              <Heading5>Appearance</Heading5>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand()
              }}
              className="w-12 h-12 rounded-lg flex items-center justify-center"
            >
              <SVGArrowCollapse className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      key={activeVersion}
      className="flex flex-col bg-interface-bg-container rounded-lg gap-sm"
    >
      <div
        className="px-1 py-2 flex items-center justify-between cursor-pointer"
        onClick={toggleExpand}
      >
        <Heading5>Appearance</Heading5>

        <div className="flex gap-2">
          <button
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              console.log('Refresh')
            }}
            aria-label="Reset appearance to default"
          >
            <SVGRefresh className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onToggle) {
                onToggle()
              }
            }}
            className="w-12 h-12 rounded-lg flex items-center justify-center"
          >
            <div className="rotate-180">
              <SVGArrowCollapse className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader icon={<SVGText className="w-5 h-5" />} label="Text" />
        <ToolsDropdown
          label="Font Family"
          defaultValue={defaultFontIndex.toString()}
          onChange={(value) => {
            const fontName = FONT_FAMILY_OPTIONS[parseInt(value)]
            appearance.onFontNameChange(fontName)
          }}
          options={FONT_FAMILY_OPTIONS.map((font, index) => ({
            label: font,
            value: index.toString()
          }))}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs leading-xs text-silver-700">Size</label>
          <div className="flex items-center h-12 gap-4">
            <button
              className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
              onClick={() => {
                const newSize = Math.max(
                  minFontSize,
                  (appearance.fontSize ?? minFontSize) - 1
                )
                appearance.onFontSizeChange(newSize)
              }}
              aria-label="Decrease font size"
            >
              <span className="text-sm leading-sm text-text-primary">A</span>
            </button>

            <Slider
              value={appearance.fontSize ?? minFontSize}
              min={minFontSize}
              max={maxFontSize}
              onChange={(value) => {
                console.log('Font size changed to:', value)
                appearance.onFontSizeChange(value)
              }}
            />

            <button
              className="flex items-center justify-center w-6 h-7 cursor-pointer hover:font-bold"
              onClick={() => {
                const newSize = Math.min(
                  maxFontSize,
                  (appearance.fontSize ?? minFontSize) + 1
                )
                appearance.onFontSizeChange(newSize)
              }}
              aria-label="Increase font size"
            >
              <span className="text-3xl leading-3xl text-text-primary">A</span>
            </button>
          </div>
        </div>
      </div>
      <Divider />

      <div className="flex flex-col gap-2">
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
          defaultValue={appearance.borderRadius}
          onChange={(value) => appearance.onBorderChange(value)}
        />
      </div>
      <Divider />

      {positionSelector && (
        <>
          <div className="flex flex-col gap-xs">
            <SectionHeader
              icon={<SVGHeaderPosition className="w-5 h-5" />}
              label="Position"
            />
            {positionSelector}
          </div>
          <Divider />
        </>
      )}

      {appearance.showAnimation && (
        <>
          <div className="flex flex-col gap-xs">
            <SectionHeader
              icon={<SVGAnimation className="w-5 h-5" />}
              label="Animation"
            />
            <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
              <Checkbox
                checked={isAnimated}
                onChange={() => {
                  appearance.onSlideAnimationChange(
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
                      ? appearance.slideAnimation
                      : lastSelectedAnimation
                  }
                  options={[
                    { label: 'Slide', value: SLIDE_ANIMATION.Slide },
                    { label: 'Fade-in', value: SLIDE_ANIMATION.FadeIn }
                  ]}
                  onChange={(value) => {
                    const selectedAnimation = value as SlideAnimationType
                    setLastSelectedAnimation(selectedAnimation)
                    appearance.onSlideAnimationChange(selectedAnimation)
                  }}
                />
              </div>
            </div>
          </div>
          <Divider />
        </>
      )}

      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGThumbnail className="w-5 h-5" />}
          label="Thumbnail"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <Checkbox
            checked={isThumbnailVisible}
            onChange={() => setIsThumbnailVisible(!isThumbnailVisible)}
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
      <Divider />

      <div className="flex justify-end">
        <ToolsSecondaryButton
          className="w-full xl:w-[140px]"
          onClick={handleDoneClick}
        >
          Done
        </ToolsSecondaryButton>
      </div>
    </div>
  )
}

export default AppearanceBuilder
