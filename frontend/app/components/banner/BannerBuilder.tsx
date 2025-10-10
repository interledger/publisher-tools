import { BANNER_FONT_SIZES, FONT_FAMILY_OPTIONS } from '@shared/types'
import {
  BannerPositionSelector,
  BannerColorsSelector,
  BuilderAccordion,
  Divider,
  ToolsDropdown,
  SectionHeader,
  CornerRadiusSelector,
  AnimationSelector,
  ThumbnailSelector
} from '@/components'
import { TitleInput } from '@/components/builder/TitleInput'
import { DescriptionInput } from '@/components/builder/DescriptionInput'
import { FontSizeInput } from '@/components/builder/FontSizeInput'
import { useUIActions, useUIState } from '~/stores/uiStore'
import {
  SVGAnimation,
  SVGColorPicker,
  SVGHeaderPosition,
  SVGRoundedCorner,
  SVGText,
  SVGThumbnail
} from '~/assets/svg'
import { useEffect, useMemo } from 'react'
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
  // https://github.com/pmndrs/valtio/issues/132
  const profile = useSnapshot(toolState.currentConfig, { sync: true })

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
        onChange={(value) => (toolState.currentConfig.bannerTitleText = value)}
        suggestions={config.suggestedTitles}
        maxLength={config.titleMaxLength}
        helpText={config.titleHelpText}
      />

      <Divider />

      <DescriptionInput
        value={profile.bannerDescriptionText}
        label={config.messageLabel}
        onChange={(text) =>
          (toolState.currentConfig.bannerDescriptionText = text)
        }
        isVisible={profile.bannerDescriptionVisible}
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
  const profile = useSnapshot(toolState.currentConfig)
  const defaultFontIndex = useMemo(
    () =>
      FONT_FAMILY_OPTIONS.findIndex(
        (option) => option === profile.bannerFontName
      ),
    [profile.bannerFontName]
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
            toolState.currentConfig.bannerFontName = fontName
          }}
          options={FONT_FAMILY_OPTIONS.map((font, index) => ({
            label: font,
            value: index.toString()
          }))}
        />
        <FontSizeInput
          value={profile.bannerFontSize}
          onChange={(value) => (toolState.currentConfig.bannerFontSize = value)}
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
        <CornerRadiusSelector
          defaultValue={profile.bannerBorder}
          onChange={(value) => (toolState.currentConfig.bannerBorder = value)}
        />
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGHeaderPosition className="w-5 h-5" />}
          label="Position"
        />
        <BannerPositionSelector
          bannerPosition={profile.bannerPosition}
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
          <AnimationSelector
            value={profile.bannerSlideAnimation}
            onChange={(value) =>
              (toolState.currentConfig.bannerSlideAnimation = value)
            }
          />
        </div>
      </div>

      <Divider />
      <div className="flex flex-col gap-xs">
        <SectionHeader
          icon={<SVGThumbnail className="w-5 h-5" />}
          label="Thumbnail"
        />
        <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
          <ThumbnailSelector
            thumbnail={profile.bannerThumbnail}
            onThumbnailChange={(thumbnail) =>
              (toolState.currentConfig.bannerThumbnail = thumbnail)
            }
          />
        </div>
      </div>
    </BuilderAccordion>
  )
}
