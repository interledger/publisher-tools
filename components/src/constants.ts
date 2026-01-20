import type { FontFamilyKey } from '@shared/types'

/**
 * Maps font names to their corresponding file names and fallback font families.
 * `fileName` corresponds to `embed/src/assets/fonts/{fileName}`.
 */
export const FONT_MAP = new Map<
  FontFamilyKey,
  { fileName: string; fallback: string[] }
>([
  [
    'Open Sans',
    {
      fileName: 'open-sans.css',
      fallback: ['Open Sans Variable', '"Segoe UI"', 'Tahoma', 'sans-serif'],
    },
  ],
  [
    'Cookie',
    {
      fileName: 'cookie.css',
      fallback: ['cursive'],
    },
  ],
  [
    'Roboto',
    {
      fileName: 'roboto.css',
      fallback: [
        '"Roboto Variable"',
        '"Franklin Gothic Medium"',
        'Tahoma',
        'sans-serif',
      ],
    },
  ],
  [
    'Titillium Web',
    {
      fileName: 'titillium-web.css',
      fallback: ['sans-serif'],
    },
  ],
])
