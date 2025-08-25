import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development'

  if (!isDevelopment && mode !== 'prepare') {
    if (!process.env.BUILD_API_URL) {
      throw new Error('env var BUILD_API_URL is not set')
    }
  }

  return {
    envDir: resolve(__dirname),
    define: {
      BUILD_API_URL: JSON.stringify(process.env.BUILD_API_URL),
    },
    build: {
      lib: {
        // entry point for the script file
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['iife'],
        name: 'InitScript',
        fileName: () => 'init.js'
      },
      outDir: resolve(__dirname, 'dist'),
      // don't clear the directory when building
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: 'init.js',
          // ensure all code is in one file
          inlineDynamicImports: true,
          compact: !isDevelopment,
          manualChunks: undefined
        },
        external: [],
        treeshake: false
      },
      cssCodeSplit: false,
      minify: !isDevelopment,
      watch: isDevelopment ? {} : null
    },
    server: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      watch: {
        // ensures file polling for file changes
        usePolling: true,
        ignored: ['node_modules/**', 'dist/**']
      }
    }
  }
})
