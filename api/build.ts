import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  define: {
    BUILD_AWS_PREFIX: JSON.stringify(process.env.BUILD_AWS_PREFIX ?? ''),
  },
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  platform: 'browser',
  target: 'es2024',
  minify: true,
  logLevel: 'info',
  legalComments: 'none',
  sourcemap: false,
  treeShaking: true,
  conditions: ['workerd', 'worker', 'browser'],
  external: ['node:*'],
  banner: {
    js: `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url || 'file:///index.js');`,
  },
  alias: {
    constants: 'node:constants',
    fs: 'node:fs',
    crypto: 'node:crypto',
    buffer: 'node:buffer',
    events: 'node:events',
    path: 'node:path',
    stream: 'node:stream',
    util: 'node:util',
    url: 'node:url',
    string_decoder: 'node:string_decoder',
  },
  plugins: [],
})
