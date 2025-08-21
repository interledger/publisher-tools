import React, { useState } from 'react'
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
  appearance: ToolAppearance
  onRefresh: () => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
  activeVersion?: string
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}

export const AppearanceBuilder: React.FC<AppearanceBuilderProps> = ({
  appearance,
  onRefresh,
  positionSelector,
  colorsSelector,
  activeVersion
}) => {
  const minFontSize = 12
  const maxFontSize = 20
  const [isThumbnailVisible, setIsThumbnailVisible] = useState(
    typeof appearance.thumbnail === 'undefined' || !!appearance.thumbnail
  )
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const { actions: uiActions, state: uiState } = useUI()
  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(() => {
      const validated = getValidSlideAnimation(appearance.slideAnimation)
      return validated === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : validated
    })
  const isAnimated = appearance.slideAnimation !== SLIDE_ANIMATION.None

  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === appearance.fontName
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
      activeVersion={activeVersion}
      onToggle={handleToggle}
      onRefresh={onRefresh}
      onDone={() => {
        uiActions.setAppearanceComplete(true)
      }}
      initialIsOpen={uiState.activeSection === 'appearance'}
      key={activeVersion}
    >
      <div className="flex flex-col gap-xs">
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
        <div className="flex flex-col gap-2xs">
          <label className="text-xs leading-xs text-silver-700">Size</label>
          <div className="flex items-center h-12 gap-md">
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
                      ? getValidSlideAnimation(appearance.slideAnimation)
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
            onChange={(checked) => {
              setIsThumbnailVisible(checked)
              appearance.onThumbnailVisibilityChange(checked)
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

export default AppearanceBuilder
