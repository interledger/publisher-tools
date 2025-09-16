import { build } from 'esbuild'
import { copy } from 'esbuild-plugin-copy'

const isDev = process.env.npm_lifecycle_script?.includes('--watch')

await build({
  entryPoints: ['src/*.ts'],
  bundle: true,
  format: 'iife',
  outdir: 'dist',
  platform: 'browser',
  target: 'es2018',
  minify: !isDev,
  logLevel: 'info',
  legalComments: isDev ? 'none' : 'linked',
  sourcemap: true,
  treeShaking: true,
  define: {
    BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL ?? '')
  },
  loader: {
    '.css': 'text',
    '.svg': 'dataurl'
  },
  plugins: [
    copy({
      assets: [{ from: 'public/**', to: '.' }]
    })
  ]
})
