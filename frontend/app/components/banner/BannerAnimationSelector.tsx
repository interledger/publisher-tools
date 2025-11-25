import { useState } from 'react'
import { type SlideAnimationType, SLIDE_ANIMATION } from '@shared/types'
import { Checkbox, ToolsDropdown } from '@/components'

interface BannerAnimationSelectorProps {
  value: SlideAnimationType
  onChange: (value: SlideAnimationType) => void
}

function getValidSlideAnimation(value: unknown): SlideAnimationType {
  return typeof value === 'string' && value in SLIDE_ANIMATION
    ? (value as SlideAnimationType)
    : SLIDE_ANIMATION.Slide
}

export function BannerAnimationSelector({
  value,
  onChange
}: BannerAnimationSelectorProps) {
  const [lastSelectedAnimation, setLastSelectedAnimation] =
    useState<SlideAnimationType>(() => {
      const validated = getValidSlideAnimation(value)
      return validated === SLIDE_ANIMATION.None
        ? SLIDE_ANIMATION.Slide
        : validated
    })
  const isAnimated = value !== SLIDE_ANIMATION.None

  return (
    <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
      <Checkbox
        checked={isAnimated}
        onChange={(visible) => {
          const animation = visible
            ? lastSelectedAnimation
            : SLIDE_ANIMATION.None
          onChange(animation)
        }}
        label="Animated"
      />
      <div className="flex-1 w-full xl:w-auto">
        <ToolsDropdown
          label="Type"
          disabled={!isAnimated}
          defaultValue={
            isAnimated ? getValidSlideAnimation(value) : lastSelectedAnimation
          }
          options={[
            { label: 'Slide', value: SLIDE_ANIMATION.Slide },
            { label: 'Fade-in', value: SLIDE_ANIMATION.FadeIn }
          ]}
          onChange={(value) => {
            const selectedAnimation = value as SlideAnimationType
            setLastSelectedAnimation(selectedAnimation)
            onChange(selectedAnimation)
          }}
        />
      </div>
    </div>
  )
}
