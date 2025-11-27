import { writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import directoryTree from 'directory-tree'
import { build } from 'esbuild'
import { copy } from 'esbuild-plugin-copy'

const isDev = process.env.npm_lifecycle_script?.includes('--watch')

await build({
  entryPoints: ['src/*.ts', 'src/assets/fonts/*.css'],
  bundle: true,
  format: 'esm',
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
  assetNames: 'assets/[ext]/[name]-[hash]',
  loader: {
    '.svg': 'dataurl',
    '.woff': 'file',
    '.woff2': 'file'
  },
  plugins: [
    rawPlugin(),
    {
      name: 'directory-tree',
      setup(build) {
        build.onEnd(() => {
          const dir = build.initialOptions.outdir
          const tree = directoryTree(dir, {
            attributes: ['type'],
            exclude: [/\b404\.html$/m, /\b_headers$/, /\.gitkeep$/]
          })

          const content = generateDirectoryTreeHTML(tree)
          const file = path.join(dir, '404.html')
          writeFileSync(file, content, 'utf-8')
        })
      }
    },
    copy({
      assets: [{ from: 'public/**', to: '.' }]
    })
  ]
})

/** @returns {import('esbuild').Plugin} */
function rawPlugin() {
  return {
    name: 'raw',
    setup(build) {
      const namespace = 'raw-loader'
      const filter = /\?raw$/
      build.onResolve({ filter }, (args) => {
        const resolvedPath = path.join(args.resolveDir, args.path)
        return { path: resolvedPath, namespace }
      })
      build.onLoad({ filter, namespace }, async (args) => {
        const contents = await readFile(args.path.replace(filter, ''))
        return { contents, loader: 'text' }
      })
    }
  }
}

/** @param {import('directory-tree').DirectoryTree} directoryTree */
function generateDirectoryTreeHTML(directoryTree) {
  const html = String.raw // for syntax highlighting

  /** @param {string} p */
  const pathToUrl = (p) => {
    return p
      .replace(/^dist./, '/')
      .split(path.sep)
      .map((s) => encodeURIComponent(s))
      .join('/')
  }

  /** @param {import('directory-tree').DirectoryTree} node */
  function buildTree(node) {
    let htmlStr = `<ul>\n`
    if (node.children) {
      for (const child of node.children) {
        if (child.type === 'file') {
          const href = pathToUrl(child.path)
          htmlStr += html`<li>
            <a href="${href}">${child.name}</a>
          </li>`
        } else if (child.type === 'directory') {
          htmlStr += html`<li>${child.name} ${buildTree(child)}</li>`
        }
      }
    } else {
      htmlStr += html`<li>${node.name}</li> `
    }
    htmlStr += `</ul>\n`
    return htmlStr
  }

  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Directory Tree</title>
      </head>
      <body>
        <h1>Directory Tree</h1>
        ${buildTree(directoryTree)}
      </body>
    </html>
  `
}
