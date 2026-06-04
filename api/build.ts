import { build } from 'esbuild'

try {
  process.loadEnvFile('.dev.vars')
} catch {
  // do nothing
}

const buildTimeVars = {
  BUILD_AWS_PREFIX: JSON.stringify(process.env.BUILD_AWS_PREFIX ?? ''),
  BUILD_UMAMI_HOST: JSON.stringify(
    process.env.BUILD_UMAMI_HOST || process.env.UMAMI_HOST || '',
  ),
  BUILD_UMAMI_WEBSITE_ID: JSON.stringify(
    process.env.BUILD_UMAMI_WEBSITE_ID || process.env.UMAMI_WEBSITE_ID || '',
  ),
}
console.log('Building...', buildTimeVars)

await build({
  entryPoints: ['src/index.ts'],
  define: buildTimeVars,
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
