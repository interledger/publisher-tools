import React from 'react'
import {
  CornerType,
  PositionType,
  SlideAnimationType,
  type ElementConfigType
} from './types.js'

const getSelectedFont = (name: string) => {
  switch (name) {
    case 'Cookie':
    case 'Roboto':
    case 'Open Sans':
    case 'Titillium Web':
      return name
    default:
      return `Arial`
  }
}

export const getIlpayCss = (config: ElementConfigType) => {
  const selectedFont = getSelectedFont(config.widgetFontName)
  const widgetButtonBorder =
    config.widgetButtonBorder == 'Light'
      ? '0.375rem'
      : config.widgetButtonBorder == 'Pill'
        ? '1rem'
        : '0'

  // use + to preserve spaces
  return `
      .ilpay_body {
        font-family: ${selectedFont}, system-ui, sans-serif !important;
        color: ${config.widgetTextColor};
      }
      .ilpay_body+button.wmt-formattable-button {
        color: ${config.widgetButtonTextColor};
        background-color: ${config.widgetButtonBackgroundColor};
        border-radius: ${widgetButtonBorder};
        transition: all 0.5s ease;
      }
      .ilpay_body+.amount-display,
      .ilpay_body+li,
      #extension-pay-form+label {
        color: ${config.widgetTextColor};
      }
      .ilpay_body+#headlessui-portal-root {
        all: revert;
      }   
      #extension-pay-form+input {
        color: #000000;
      }
      #extension-pay-form+input.disabled {
        background-color: #eeeeee;
        color: #666;
      }
      #quote-form > div.flex:nth-child(3) {
        flex-direction: column;
      }
      #__next > div.flex.h-full.flex-col.items-center.justify-center.px-5 > div") {
        bacground-color: #ffffff;
      }
      #__next > div.flex.h-full.flex-col.items-center.justify-center.px-5 > div > div.mt-20.text-base {
        margin-top: 2rem;
      }
      `
    .trim()
    .replaceAll(' ', '')
    .replaceAll('\n', '')
    .replaceAll('+', ' ')
}

export const generateConfigCss = (
  config: ElementConfigType,
  returnRaw = false
) => {
  // const selectedButtonFont = getSelectedFont(config.buttonFontName)
  const selectedBannerFont = getSelectedFont(config.bannerFontName)
  const selectedWidgetFont = getSelectedFont(config.widgetFontName)
  const buttonBorder =
    config.buttonBorder == CornerType.Light
      ? '0.375rem'
      : config.buttonBorder == CornerType.Pill
        ? '1rem'
        : '0'

  const bannerBorder =
    config.bannerBorder == CornerType.Light
      ? '0.375rem'
      : config.bannerBorder == CornerType.Pill
        ? '1rem'
        : '0'

  const widgetButtonBorder =
    config.widgetButtonBorder == CornerType.Light
      ? '0.375rem'
      : config.widgetButtonBorder == CornerType.Pill
        ? '1rem'
        : '0'

  const css = `       
        .wm_button {
            font-family: ${selectedWidgetFont}, system-ui, sans-serif !important;
            font-size: 16px;
            padding: 8px 20px;
            border: 1px solid transparent;
            color: ${config.buttonTextColor};
            background-color: ${config.buttonBackgroundColor};
            border-radius: ${buttonBorder};
            transition: all 0.5s ease;
        }       
        .wm_banner {
            font-family: ${selectedBannerFont}, system-ui, sans-serif !important;
            font-size: ${config.bannerFontSize}px;
            padding: 0 20px;
            border: 1px solid transparent;
            border-radius: ${bannerBorder};
            color: ${config.bannerTextColor};
            background-color: ${config.bannerBackgroundColor};
            transition: all 0.5s ease;
            overflow: hidden;
        }
        .wm_banner.bottom {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .wm_banner h5 {
            font-size: ${(config.bannerFontSize ?? 16) + 2}px;
            margin-top: 12px;
        }
        .wm_banner h5 span {
            font-size: ${(config.bannerFontSize ?? 16) + 2}px;
        }
        .wm_banner ._wm_link {
          display: block;
          margin-bottom: 12px;
        }

        .wm_widget .content {
            font-family: ${selectedWidgetFont}, system-ui, sans-serif !important;
            font-size: ${(config.widgetFontSize ?? 16) - 2}px;
            padding: 12px 20px;
            color: ${config.widgetTextColor};
            background-color: ${config.widgetBackgroundColor};
        }
        .wm_widget .trigger {
          background-color: ${config.widgetTriggerBackgroundColor};
        }
        .wm_widget .content h5 {
          font-size: ${config.widgetFontSize}px;
        }

        .ilpay_body {
          font-family: ${selectedWidgetFont}, system-ui, sans-serif !important;
          color: ${config.widgetTextColor};
        }

        .ilpay_body #headlessui-portal-root {
          all:revert;
        }

        .ilpay_body .amount-display,
        .ilpay_body li,
        #extension-pay-form label {
          color: ${config.widgetTextColor};
        }

        #extension-pay-form input {
          color: #000000;
        }

        #extension-pay-form input.disabled {
          background-color: #eeeeee;
          color: #666;
        }

        .ilpay_body button.wmt-formattable-button {
            color: ${config.widgetButtonTextColor};
            background-color: ${config.widgetButtonBackgroundColor};
            border-radius: ${widgetButtonBorder};
            transition: all 0.5s ease;
        }

        .animate {
          animation-name: slideDown;
          animation-duration: 4s;
        }

        @keyframes slideDown {
          0% {
              max-height: 0px;
          }
          100% {
              max-height: 300px;
          }
        }
    `
  if (returnRaw) {
    return css
  }

  return React.createElement('style', {
    dangerouslySetInnerHTML: { __html: css }
  })
}

export const isColorLight = (color: string) => {
  let r, g, b, colorPart

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If HEX --> separate the red, green, blue values in separate variables
    colorPart =
      color.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
      ) || []

    r = colorPart[1]
    g = colorPart[2]
    b = colorPart[3]
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    if (color.length < 5) {
      colorPart = +('0x' + color.slice(1).replace(/./g, '$&$&'))
    } else {
      colorPart = +('0x' + color.slice(1))
    }

    r = colorPart >> 16
    g = (colorPart >> 8) & 255
    b = colorPart & 255
  }

  r = Number(r)
  g = Number(g)
  b = Number(b)
  // HSP equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))

  // Using the HSP value, the color is light or not (dark)
  return hsp > 192 ? true : false
}

// Unused at the moment.
// @arpi: Can be removed?
export const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export const removeItem = <T>(arr: Array<T>, value: T): Array<T> => {
  const index = arr.indexOf(value)
  if (index > -1) {
    arr.splice(index, 1)
  }
  return arr
}

// Inspired from: https://github.com/sveltejs/svelte/blob/main/sites/svelte-5-preview/src/routes/gzip.js
export const encodeAndCompressParameters = async (params: string) => {
  let buffer = ''
  const reader = new Blob([params])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
    .getReader()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      reader.releaseLock()
      break
    } else {
      for (let i = 0; i < value.length; i++) {
        // decoding as utf-8 will make btoa reject the string
        buffer += String.fromCharCode(value[i])
      }
    }
  }

  return btoa(buffer).replaceAll('+', '-').replaceAll('/', '_')
}

export const processSVG = async (
  file: File,
  maxSize: number = 100
): Promise<string> => {
  const text = await file.text() // Read SVG content as text
  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(text, 'image/svg+xml')
  const svgElement = svgDoc.documentElement

  // Set new width and height
  svgElement.setAttribute('width', String(maxSize))
  svgElement.setAttribute('height', String(maxSize))

  // Convert the modified SVG back to a string
  const serializer = new XMLSerializer()
  const resizedSVG = serializer.serializeToString(svgElement)

  // Encode the SVG string as Base64
  return `data:image/svg+xml;base64,${btoa(resizedSVG)}`
}

export const getWebMonetizationLink = () => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  // Detect browsers
  if (userAgent.includes('Firefox')) {
    return `Get the&nbsp;<a rel="noindex nofollow" target="_blank" href="https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/">extension</a>`
  } else if (
    userAgent.includes('Chrome') &&
    !userAgent.includes('Edg') &&
    !userAgent.includes('OPR')
  ) {
    return `Get the&nbsp;<a rel="noindex nofollow" target="_blank" href="https://chromewebstore.google.com/detail/web-monetization-extensio/oiabcfomehhigdepbbclppomkhlknpii">extension</a>`
  } else if (userAgent.includes('Edg')) {
    return `Get the&nbsp;<a rel="noindex nofollow" target="_blank" href="https://microsoftedge.microsoft.com/addons/detail/web-monetization-extensio/imjgemgmeoioefpmfefmffbboogighjl">extension</a>`
    //   } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    //     return "Safari"
    //   } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
    //     return "Internet Explorer"
  } else {
    return `Learn more&nbsp;<a rel="noindex nofollow" target="_blank" href="https://webmonetization.org/">here</a>.`
  }
}

export function getDefaultData(): ElementConfigType {
  return {
    versionName: 'Default preset', // Default version name
    walletAddress: undefined,
    buttonFontName: 'Arial',
    buttonText: 'Support me',
    buttonBorder: CornerType.Light,
    buttonTextColor: '#ffffff',
    buttonBackgroundColor: '#ff808c',
    bannerFontName: 'Arial',
    bannerFontSize: 16,
    bannerTitleText: 'How to support?',
    bannerDescriptionText:
      'You can support this page and my work by a one time donation or proportional to the time you spend on this website through web monetization.',
    bannerSlideAnimation: SlideAnimationType.Down,
    bannerPosition: PositionType.Bottom,
    bannerTextColor: '#ffffff',
    bannerBackgroundColor: '#7f76b2',
    bannerBorder: CornerType.Light,
    widgetFontName: 'Arial',
    widgetFontSize: 16,
    widgetDonateAmount: 1,
    widgetTitleText: 'Future of support',
    widgetDescriptionText:
      'Experience the new way to support our content. Activate Web Monetization in your browser and support our work as you browse. Every visit helps us keep creating the content you love! You can also support us by a one time donation below!',
    widgetButtonText: 'Support me',
    widgetButtonBackgroundColor: '#4ec6c0',
    widgetButtonTextColor: '#000000',
    widgetButtonBorder: CornerType.Light,
    widgetTextColor: '#000000',
    widgetBackgroundColor: '#ffffff',
    widgetTriggerBackgroundColor: '#ffffff',
    widgetTriggerIcon: ''

    // This CSS string is generated from the configuration values above through these steps:
    // 1. the generateConfigCss() function creates raw CSS rules using all the configuration values
    // 2. the raw CSS string is compressed using gzip via CompressionStream
    // 3. the compressed binary data is converted to a base64 string with encodeAndCompressParameters()
    // 4. the process is equivalent to calling: encodeAndCompressParameters(generateConfigCss(config, true))
    // allows storage and transmission of all tools styling information
    // css: 'H4sIAAAAAAAAA61S227bMAz9lW5-WYFQCFIkA2ygQL8koCy64UZJrkR1Ngz_-2BtaRds6NP4JJE6Fx7IsIw4n2108zLEoDCgZ5nbp8QouzxnJQ-FdxlDhkyJh0_sx5gUg3Z9lJjaZqjVread684W1RjMD68wxORRFa0Q_Govt0CL_ffnFEtw8HuAB-uc7WxMjhIkdFxyuzcPX4-JfKcJQ2blGFoU2ZtjJsx0q2_QxxIUHOdRcN79ORPeNTQphcwxwIhztXgnaEmWD3ZqLoROKOfCUCMQSDHqgiJtoldK2q3_IuYwFr0S72t98NA4zltWbvk7F6p1zf10OnVr81KiUsU_On41g9DUBr1Af2FxXx7ul60DjhP1NbI-SvGhW5vzOdCkbyBzgaGI1POmZ1jJZ-gpKCXzrWTlYb5exwmOG_Lz_eby1uQ1uv8iUNFe4bA3SpOCxUyLx_TMATSO7WH7EOtPZC6FXcYCAAA='
  }
}

export const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
