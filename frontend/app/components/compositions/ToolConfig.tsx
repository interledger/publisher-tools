import { cx } from 'class-variance-authority'
import { useState } from 'react'
import type {
  CornerType,
  ElementConfigType,
  SlideAnimationType
} from '@shared/types'
import type { ElementErrors } from '~/lib/types.js'
import {
  type PositionType,
  bgColors,
  controlOptions,
  cornerOptions,
  fontOptions,
  slideOptions,
  positionOptions,
  widgetControlOptions
} from '~/lib/presets.js'
import {
  Button,
  Input,
  Select,
  ColorPicker,
  Textarea,
  NotFoundConfig,
  WalletAddress,
  UploadControl,
  FontSize
} from '../index.js'
import { tooltips } from '~/lib/tooltips.js'
import refreshSvg from '~/assets/images/refresh.svg'

type ToolConfigProps = {
  type?: string
  toolConfig: ElementConfigType
  defaultConfig: ElementConfigType
  setToolConfig: React.Dispatch<React.SetStateAction<ElementConfigType>>
  errors?: ElementErrors
  isSubmiting?: boolean
  openWidget?: boolean
  setOpenWidget?: React.Dispatch<React.SetStateAction<boolean>>
}

type PartialToolConfigProps = Omit<ToolConfigProps, 'defaultConfig'>

const ButtonConfig = ({
  toolConfig: config,
  setToolConfig,
  errors
}: Omit<PartialToolConfigProps, 'type'>) => {
  const [displayedControl, setDisplayedControl] = useState('background')
  const defaultFontValue = fontOptions.find(
    (option) => option.value == config?.buttonFontName
  )

  const bgColor = bgColors.button

  return (
    <div className="w-full">
      <div
        className={cx(
          'main_controls flex justify-between bg-gradient-to-r',
          bgColor
        )}
      >
        <div className="flex">
          <ColorPicker
            label="Background color"
            name="buttonBackgroundColor"
            preset="background"
            value={config?.buttonBackgroundColor}
            updateColor={(value) =>
              setToolConfig({
                ...config,
                buttonBackgroundColor: value
              })
            }
            className={cx(displayedControl != 'background' && 'hidden')}
          />
          <ColorPicker
            label="Text color"
            name="buttonTextColor"
            preset="text"
            value={config?.buttonTextColor}
            updateColor={(value) => {
              setToolConfig({ ...config, buttonTextColor: value })
            }}
            className={cx(displayedControl != 'text' && 'hidden')}
          />
        </div>
        <div className="flex items-center max-w-36 w-32 mr-3">
          <Select
            placeholder="Background"
            options={controlOptions}
            defaultValue={controlOptions.find(
              (opt) => opt.value == 'background'
            )}
            onChange={(value) => setDisplayedControl(value)}
          />
        </div>
      </div>
      <div className="flex items-start w-full gap-2 mt-4">
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            name="buttonFontName"
            placeholder="Select Font"
            options={fontOptions}
            value={defaultFontValue}
            onChange={(value) =>
              setToolConfig({ ...config, buttonFontName: value ?? '' })
            }
          />
        </div>
        <div className="flex w-full items-center">
          <Input
            withBorder
            name="buttonText"
            value={config?.buttonText || ''}
            className="w-full"
            error={errors?.fieldErrors.buttonText}
            onChange={(e) =>
              setToolConfig({ ...config, buttonText: e.target.value ?? '' })
            }
          />
        </div>
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            name="buttonBorder"
            placeholder="Select Rounding"
            options={cornerOptions}
            value={cornerOptions.find(
              (opt) => opt.value == config?.buttonBorder
            )}
            onChange={(value) =>
              setToolConfig({ ...config, buttonBorder: value as CornerType })
            }
          />
        </div>
      </div>
    </div>
  )
}

const BannerConfig = ({
  toolConfig: config,
  setToolConfig,
  errors
}: Omit<PartialToolConfigProps, 'type'>) => {
  const [displayedControl, setDisplayedControl] = useState('background')
  const defaultFontValue = fontOptions.find(
    (option) => option.value == config?.bannerFontName
  )

  const bgColor = bgColors.banner
  const characterLimit = 500

  return (
    <div className="w-full font-sans text-sm">
      <div
        className={cx(
          'main_controls flex justify-between bg-gradient-to-r',
          bgColor
        )}
      >
        <div className="flex">
          <ColorPicker
            label="Background color"
            name="bannerBackgroundColor"
            preset="background"
            value={config?.bannerBackgroundColor}
            updateColor={(value) =>
              setToolConfig({
                ...config,
                bannerBackgroundColor: value
              })
            }
            className={cx(displayedControl != 'background' && 'hidden')}
          />
          <ColorPicker
            label="Text color"
            name="bannerTextColor"
            preset="text"
            value={config?.bannerTextColor}
            updateColor={(value) => {
              setToolConfig({ ...config, bannerTextColor: value })
            }}
            className={cx(displayedControl != 'text' && 'hidden')}
          />
        </div>
        <div className="flex items-center max-w-36 w-32 mr-3">
          <Select
            placeholder="Background"
            options={controlOptions}
            defaultValue={controlOptions.find(
              (opt) => opt.value == 'background'
            )}
            onChange={(value) => setDisplayedControl(value)}
          />
        </div>
      </div>
      <div className="flex items-start w-full gap-2 mt-4">
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            label="Position"
            name="bannerPosition"
            placeholder="Select banner position"
            options={positionOptions}
            value={positionOptions.find(
              (opt) => opt.value == config?.bannerPosition
            )}
            onChange={(value) =>
              setToolConfig({
                ...config,
                bannerPosition: value as PositionType
              })
            }
          />
        </div>
        <div className="flex items-center max-w-36 w-36 shrink-0">
          <Select
            withBorder
            label="Animation"
            name="bannerSlideAnimation"
            placeholder="Select banner animation"
            options={slideOptions}
            value={slideOptions.find(
              (opt) => opt.value == config?.bannerSlideAnimation
            )}
            onChange={(value) =>
              setToolConfig({
                ...config,
                bannerSlideAnimation: value as SlideAnimationType
              })
            }
          />
        </div>
        <div className="flex items-center max-w-72 w-72 shrink-0">
          <Select
            withBorder
            label="Border"
            name="bannerBorder"
            placeholder="Select Rounding"
            options={cornerOptions}
            value={cornerOptions.find(
              (opt) => opt.value == config?.bannerBorder
            )}
            onChange={(value) =>
              setToolConfig({ ...config, bannerBorder: value as CornerType })
            }
          />
        </div>
      </div>
      <div className="flex items-start w-full gap-2 mt-4">
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            name="bannerFontName"
            label="Font"
            tooltip={tooltips.font}
            placeholder="Select Font"
            options={fontOptions}
            value={defaultFontValue}
          />
        </div>
        <div className="flex items-center max-w-20 w-18 shrink-0">
          <FontSize
            name="bannerFontSize"
            label="Size"
            value={config?.bannerFontSize || 16}
            updateSize={(value) =>
              setToolConfig({ ...config, bannerFontSize: Number(value ?? 16) })
            }
          />
        </div>
        <div className="flex w-full items-center">
          <Input
            withBorder
            label="Title"
            name="bannerTitleText"
            value={config?.bannerTitleText || ''}
            className="w-full"
            onChange={(e) => {
              if (e.target.value.length <= characterLimit) {
                setToolConfig({
                  ...config,
                  bannerTitleText: e.target.value ?? ''
                })
              }
            }}
            maxLength={characterLimit}
          />
        </div>
      </div>

      <div>
        <Textarea
          className="p-2"
          label="Text"
          name="bannerDescriptionText"
          value={config?.bannerDescriptionText || ''}
          onChange={(e) => {
            if (e.target.value.length <= characterLimit) {
              setToolConfig({
                ...config,
                bannerDescriptionText: e.target.value ?? ''
              })
            }
          }}
          maxLength={characterLimit}
          error={errors?.fieldErrors.bannerDescriptionText}
        />
      </div>
    </div>
  )
}

const WidgetConfig = ({
  toolConfig: config,
  setToolConfig,
  errors
}: Omit<PartialToolConfigProps, 'type'>) => {
  const [displayedControl, setDisplayedControl] = useState('background')
  const defaultFontValue = fontOptions.find(
    (option) => option.value == config?.widgetFontName
  )
  const bgColor = bgColors.widget

  return (
    <div className="w-full font-sans text-sm">
      <div
        className={cx(
          'main_controls flex justify-between bg-gradient-to-r',
          bgColor
        )}
      >
        <div className="flex w-full">
          <ColorPicker
            label="Background color"
            name="widgetBackgroundColor"
            preset="background"
            value={config?.widgetBackgroundColor}
            updateColor={(value) =>
              setToolConfig({
                ...config,
                widgetBackgroundColor: value
              })
            }
            className={cx(displayedControl != 'background' && 'hidden')}
          />
          <ColorPicker
            label="Text color"
            name="widgetTextColor"
            preset="text"
            value={config?.widgetTextColor}
            updateColor={(value) => {
              setToolConfig({ ...config, widgetTextColor: value })
            }}
            className={cx(displayedControl != 'text' && 'hidden')}
          />
          <ColorPicker
            label="Button Background color"
            name="widgetButtonBackgroundColor"
            preset="background"
            value={config?.widgetButtonBackgroundColor}
            updateColor={(value) =>
              setToolConfig({
                ...config,
                widgetButtonBackgroundColor: value
              })
            }
            className={cx(displayedControl != 'buttonbackground' && 'hidden')}
          />
          <ColorPicker
            label="Button Text color"
            name="widgetButtonTextColor"
            preset="text"
            value={config?.widgetButtonTextColor}
            updateColor={(value) => {
              setToolConfig({ ...config, widgetButtonTextColor: value })
            }}
            className={cx(displayedControl != 'buttontext' && 'hidden')}
          />
          <div
            className={cx(
              'flex items-center justify-between w-full flex-row',
              displayedControl != 'trigger' && 'hidden'
            )}
          >
            <ColorPicker
              label="Trigger Background color"
              name="widgetTriggerBackgroundColor"
              preset="trigger"
              allowCustomColors={!!config?.widgetTriggerIcon}
              value={config?.widgetTriggerBackgroundColor}
              updateColor={(value) => {
                setToolConfig({
                  ...config,
                  widgetTriggerBackgroundColor: value
                })
              }}
            />
            <UploadControl
              name="widgetTriggerIcon"
              value={config?.widgetTriggerIcon}
              setImage={(value, color) => {
                setToolConfig({
                  ...config,
                  widgetTriggerIcon: value,
                  widgetTriggerBackgroundColor: color
                    ? color
                    : config.widgetTriggerBackgroundColor
                })
              }}
            />
          </div>
        </div>
        <div className="flex items-center max-w-36 w-44 mr-3">
          <Select
            placeholder="Background"
            options={widgetControlOptions}
            defaultValue={widgetControlOptions.find(
              (opt) => opt.value == 'background'
            )}
            onChange={(value) => setDisplayedControl(value)}
          />
        </div>
      </div>
      <div className="flex items-start w-full gap-2 mt-4">
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            label="Font"
            name="widgetFontName"
            placeholder="Select Font"
            options={fontOptions}
            value={defaultFontValue}
          />
        </div>
        <div className="flex items-center max-w-20 w-18 shrink-0">
          <FontSize
            name="widgetFontSize"
            label="Size"
            value={config?.widgetFontSize}
            updateSize={(value) =>
              setToolConfig({ ...config, widgetFontSize: Number(value ?? 16) })
            }
          />
        </div>
        <div className="flex w-full items-center">
          <Input
            withBorder
            label="Title"
            name="widgetTitleText"
            value={config?.widgetTitleText || ''}
            className="w-full"
            onChange={(e) =>
              setToolConfig({
                ...config,
                widgetTitleText: e.target.value ?? ''
              })
            }
          />
        </div>
      </div>
      <div>
        <Textarea
          className="p-2"
          label="Text"
          name="widgetDescriptionText"
          value={config?.widgetDescriptionText || ''}
          onChange={(e) =>
            setToolConfig({
              ...config,
              widgetDescriptionText: e.target.value ?? ''
            })
          }
          error={errors?.fieldErrors.widgetDescriptionText}
        />
      </div>
      <div className="flex items-start w-full gap-2 mt-4">
        <div className="flex items-center max-w-36 w-32 shrink-0">
          <Select
            withBorder
            label="Button rounding"
            name="widgetButtonBorder"
            placeholder="Select Rounding"
            options={cornerOptions}
            value={cornerOptions.find(
              (opt) => opt.value == config?.widgetButtonBorder
            )}
            onChange={(value) => {
              setToolConfig({
                ...config,
                widgetButtonBorder: value as CornerType
              })
            }}
          />
        </div>
        <div className="flex items-center w-full">
          <Input
            withBorder
            label="Button title"
            name="widgetButtonText"
            value={config?.widgetButtonText || ''}
            className="w-full"
            onChange={(e) => {
              setToolConfig({
                ...config,
                widgetButtonText: e.target.value ?? ''
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

const RenderElementConfig = ({
  type,
  toolConfig,
  setToolConfig,
  errors
}: PartialToolConfigProps) => {
  switch (type) {
    case 'button':
      return (
        <ButtonConfig
          toolConfig={toolConfig}
          setToolConfig={setToolConfig}
          errors={errors}
        />
      )
    case 'banner':
      return (
        <BannerConfig
          toolConfig={toolConfig}
          setToolConfig={setToolConfig}
          errors={errors}
        />
      )
    case 'widget':
      return (
        <WidgetConfig
          toolConfig={toolConfig}
          setToolConfig={setToolConfig}
          errors={errors}
        />
      )
    default:
      return <NotFoundConfig />
  }
}

export const ToolConfig = ({
  type,
  toolConfig,
  defaultConfig,
  setToolConfig,
  isSubmiting,
  errors
}: ToolConfigProps) => {
  return (
    <div className="flex flex-col">
      <RenderElementConfig
        type={type}
        toolConfig={toolConfig}
        setToolConfig={setToolConfig}
        errors={errors}
      />
      <div className="flex w-full items-center">
        <WalletAddress
          errors={errors}
          config={toolConfig}
          setToolConfig={setToolConfig}
        />
      </div>
      <div className="flex justify-end items-end">
        <div className="flex w-full">
          <Button
            intent="reset"
            className="mr-2 ml-0"
            aria-label="reset config"
            disabled={isSubmiting}
            onClick={() => setToolConfig(defaultConfig)}
          >
            Reset
          </Button>
          <Button
            className="mr-0"
            aria-label="save config"
            type="submit"
            disabled={isSubmiting}
            value="update"
            name="intent"
          >
            <img
              className={cx(
                'flex max-h-24 mr-2',
                isSubmiting ? 'animate-spin' : ''
              )}
              src={refreshSvg}
              alt="generate"
            />
            <span>Generate</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
