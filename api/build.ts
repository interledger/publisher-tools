import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  platform: 'node',
  target: 'es2018',
  minify: true,
  logLevel: 'info',
  legalComments: 'none',
  sourcemap: true,
  treeShaking: true,
  define: {
    BUILD_AWS_PREFIX: JSON.stringify(process.env.BUILD_AWS_PREFIX ?? ''),
  },
  plugins: [],
})
