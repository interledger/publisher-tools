import fs from 'node:fs'
import { fileURLToPath } from 'url'

const source = fileURLToPath(new URL('.dev.vars', import.meta.url))
try {
  fs.copyFileSync(source, '.dev.vars')
  console.log('.dev.vars copied successfully')
} catch (error) {
  console.error('Error copying .dev.vars:', error.message)
  process.exit(1)
}
