import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { build } from 'esbuild'
import directoryTree from 'directory-tree'

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
    {
      name: 'directory-tree',
      setup(build) {
        build.onEnd(() => {
          const dir = build.initialOptions.outdir
          const tree = directoryTree(dir, {
            attributes: ['type'],
            exclude: [/404\.html$/]
          })

          const content = generateDirectoryTreeHTML(tree)
          const file = path.join(dir, '404.html')
          writeFileSync(file, content, 'utf-8')
        })
      }
    }
  ]
})

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
