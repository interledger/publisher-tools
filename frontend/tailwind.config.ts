/** @type {import('tailwindcss').Config} */

const palettes = {
  // Green palette
  'green-50': '#DBE9E7',
  'green-200': '#ABE4DF',
  'green-400': '#56B7B5',
  'green-600': '#27797A',
  'green-800': '#204D4F',

  // Purple palette
  'purple-50': '#F3F4FA',
  'purple-100': '#A7A6D3',
  'purple-300': '#7469A8',
  'purple-600': '#5B5380',
  'purple-800': '#2D2A3C',

  // Mint palette
  'mint-50': '#F2FBF9',
  'mint-100': '#D4F3EB',
  'mint-300': '#98E1D0',
  'mint-600': '#4AB7A5',
  'mint-800': '#247D71',

  // Blue palette
  'blue-50': '#F6F8FA',
  'blue-100': '#D0DDED',
  'blue-300': '#A3BEDC',
  'blue-600': '#5A77B6',
  'blue-800': '#455588',

  // Orange palette
  'orange-50': '#FFF6ED',
  'orange-100': '#FFD3A8',
  'orange-300': '#FF9852',
  'orange-600': '#EF4C07',
  'orange-800': '#9D2D0F',

  // Pink palette
  'pink-50': '#FEF1F5',
  'pink-100': '#FEE5EE',
  'pink-300': '#FFC8DC',
  'pink-600': '#FF6698',
  'pink-800': '#EB174A',

  // Red palette
  'red-50': '#FFF1F2',
  'red-100': '#FEE5EE',
  'red-300': '#FF7A7F',
  'red-600': '#E51D25',
  'red-800': '#A01419',

  // Neutrals
  'black': '#000000',
  'white': '#FFFFFF',
  'silver-50': '#F7F7F7',
  'silver-100': '#EFEFEF',
  'silver-200': '#DFDFDF',
  'silver-300': '#C9C9C9',
  'silver-400': '#ADADAD',
  'silver-500': '#999999',
  'silver-600': '#888888',
  'silver-700': '#7B7B7B',
  'silver-800': '#676767',
  'silver-900': '#545454',
  'silver-950': '#363636'
} as const

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'text-style-h1',
    'text-style-h2',
    'text-style-h2-semibold',
    'text-style-h3',
    'text-style-h4',
    'text-style-h5',
    'text-style-h6',
    'text-style-body-standard',
    'text-style-body-emphasis',
    'text-style-small-standard',
    'text-style-small-emphasis',
    'text-style-caption-standard',
    'text-style-caption-emphasis'
  ],
  theme: {
    extend: {
      colors: {
        ...palettes,
        'interface-bg-main': palettes['blue-50'],
        'interface-bg-container': palettes['white'],
        'interface-edge-container': palettes['silver-200'],
        'interface-heading-container': palettes['purple-300'],
        'interface-bg-stickymenu': palettes['silver-100'],
        'interface-tooltip': palettes['purple-800'],

        'primary-bg': palettes['green-400'],
        'primary-bg-hover': palettes['green-600'],
        'primary-focus': palettes['purple-600'],

        'secondary-edge': palettes['purple-300'],
        'secondary-edge-hover': palettes['purple-600'],
        'secondary-hover-surface': palettes['purple-50'],

        'text-primary': palettes['silver-950'],
        'text-secondary': palettes['silver-600'],
        'text-placeholder': palettes['silver-700'],
        'text-disabled': palettes['silver-300'],
        'text-error': palettes['red-600'],
        'text-success': palettes['green-600'],
        'text-buttons-default': palettes['purple-300'],

        'field-border': palettes['silver-300'],
        'field-border-hover': palettes['silver-400'],
        'field-border-focus': palettes['purple-600'],
        'field-border-disabled': palettes['silver-200'],
        'field-bg-disabled': palettes['silver-100'],
        'field-border-error': palettes['red-600'],
        'field-helpertext-default': palettes['silver-800'],

        'landing-footer-bg': palettes['mint-100'],
        'landing-button-bg': palettes['black'],
        'landing-button-bg-hover': palettes['silver-950'],
        'landing-button-border': palettes['silver-800'],
        'landing-button-border-hover': palettes['black'],
        'landing-pill-border': palettes['blue-300'],
        'landing-content': palettes['silver-800'],

        'footer-bg': palettes['mint-100'],
        'footer-content': palettes['silver-800'],

        'nav-link-default': palettes['purple-300'],
        'nav-link-hover': palettes['purple-600'],

        // Custom old WM colors
        'wm-green': '#5BC8BB',
        'wm-green-fade': '#BFEEE8',
        'wm-green-shade': '#92DBCA',
        'wm-dark-green': '#005D84',
        'wm-dark-green-fade': '#4A989D',
        'wm-pink': '#F8C6DB',
        'wm-red': '#EF4E71',
        'wm-red-fade': '#EFA4B4',
        'wm-orange': '#F69656',
        'wm-teal': '#9CD6CB',
        'wm-purple': '#7F76B2'
      },

      spacing: {
        '3xs': '2px',
        '2xs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '60px',
        '5xl': '120px',

        // Custom old sizes
        '256': '72rem',
        '148': '42rem',
        '128': '36rem'
      },

      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '60px',
        '7xl': '72px'
      },

      lineHeight: {
        'xs': '16px',
        'sm': '20px',
        'md': '24px',
        'lg': '26px',
        'xl': '28px',
        '2xl': '32px',
        '3xl': '38px',
        '4xl': '44px',
        '5xl': '56px',
        '6xl': '70px',
        '7xl': '80px'
      },

      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },

      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ],
        mono: [
          'ui-monospace',
          'Cascadia Code',
          'Source Code Pro',
          'Menlo',
          'Consolas',
          'DejaVu Sans Mono',
          'monospace'
        ]
      },

      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        full: '99999px'
      },

      // typography styles
      textStyles: {
        'h1': [
          '48px',
          {
            lineHeight: '56px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'h2': [
          '36px',
          {
            lineHeight: '44px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'h2-semibold': [
          '36px',
          {
            lineHeight: '44px',
            fontWeight: '600', // Semi-bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'h3': [
          '30px',
          {
            lineHeight: '38px',
            fontWeight: '500', // Medium
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'h4': [
          '24px',
          {
            lineHeight: '32px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'h5': [
          '20px', // font-size xl
          {
            lineHeight: '28px',
            fontWeight: '400', // Regular
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#8075B3' // purple-300
          }
        ],
        'h6': [
          '18px',
          {
            lineHeight: '26px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],

        // Body text styles
        'body-standard': [
          '16px',
          {
            lineHeight: '24px',
            fontWeight: '400', // Regular
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'body-emphasis': [
          '16px',
          {
            lineHeight: '24px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        // Small text styles
        'small-standard': [
          '14px',
          {
            lineHeight: '20px',
            fontWeight: '400', // Regular
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'small-emphasis': [
          '14px',
          {
            lineHeight: '20px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        // Caption
        'caption-standard': [
          '12px',
          {
            lineHeight: '16px',
            fontWeight: '400', // Regular
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        'caption-emphasis': [
          '12px',
          {
            lineHeight: '16px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui',
            color: '#363636' // silver-950
          }
        ],
        // Display text
        'display-1': [
          '72px',
          {
            lineHeight: '80px',
            fontWeight: '700', // Bold
            fontFamily: 'Inter, ui-sans-serif, system-ui'
          }
        ],
        'display-2': [
          '60px',
          {
            lineHeight: '70px',
            fontWeight: '500', // Medium
            fontFamily: 'Inter, ui-sans-serif, system-ui'
          }
        ]
      },

      // Custom old heights and widths
      height: {
        '148': '42rem'
      },
      width: {
        '256': '72rem',
        '148': '42rem',
        '128': '36rem',
        'md-old': '28rem'
      },

      padding: {
        '3xs': '2px',
        '2xs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '60px',
        '3xl': '120px'
      }
    }
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const textStylesUtilities = {}
      const textStyles = theme('textStyles')

      for (const key in textStyles) {
        const [fontSize, options] = textStyles[key]
        const { lineHeight, fontWeight, fontFamily, color } = options

        textStylesUtilities[`.text-style-${key}`] = {
          fontSize,
          lineHeight,
          fontWeight,
          fontFamily,
          color
        }
      }

      addUtilities(textStylesUtilities)
    }
  ]
}
