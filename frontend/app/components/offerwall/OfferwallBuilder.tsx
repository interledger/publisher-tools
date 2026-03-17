import { useEffect } from 'react'
import { subscribe } from 'valtio'
import {
  Divider,
  ToolsDropdown,
  CornerRadiusSelector,
  OfferwallColorsSelector,
} from '@/components'
import { InputFieldset } from '@/components/builder/InputFieldset'
import { BuilderAccordion } from '@/components/BuilderAccordion'
import {
  type Background,
  type TextColor,
  FONT_FAMILY_OPTIONS,
} from '@shared/types'
import { SVGColorPicker, SVGRoundedCorner, SVGText } from '~/assets/svg'
import { useOfferwallProfile } from '~/stores/offerwall-store'
import { toolActions } from '~/stores/toolStore'
import { useUIState } from '~/stores/uiStore'

interface Props {
  onRefresh: () => void
}

export function OfferwallBuilder({ onRefresh }: Props) {
  return (
    <>
      <AppearanceBuilder onRefresh={onRefresh} />
    </>
  )
}

function AppearanceBuilder({ onRefresh }: Props) {
  const uiState = useUIState()
  const [snap, profile] = useOfferwallProfile()
  const defaultFontIndex = FONT_FAMILY_OPTIONS.findIndex(
    (option) => option === snap.font.name,
  )

  useEffect(() => {
    const unsubscribe = subscribe(profile, () => {
      toolActions.setBuildCompleteStep('filled')
    })

    return unsubscribe
  }, [])

  return (
    <BuilderAccordion
      title="Appearance"
      isComplete={uiState.appearanceComplete}
      onRefresh={onRefresh}
      isOpen
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
      </InputFieldset>

      <Divider />

      <InputFieldset
        label="Colors"
        icon={<SVGColorPicker className="w-5 h-5" />}
      >
        <OfferwallColorsSelector
          backgroundColor={snap.color.background}
          textColor={snap.color.text}
          headlineColor={snap.color.headline}
          themeColor={snap.color.theme}
          onBackgroundColorChange={(color: Background) => {
            profile.color.background = color
          }}
          onTextColorChange={(color: TextColor) => {
            profile.color.text = color
          }}
          onHeadlineColorChange={(color: TextColor) => {
            profile.color.headline = color
          }}
          onThemeColorChange={(color: Background) => {
            profile.color.theme = color
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
    </BuilderAccordion>
  )
}
