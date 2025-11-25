import { APP_BASEPATH } from './app/lib/constants.js'
import type { Config } from '@react-router/dev/config'

export default {
  ssr: true,
  basename: APP_BASEPATH,
  appDirectory: 'app',
  buildDirectory: 'build',
  serverModuleFormat: 'esm'
} satisfies Config
