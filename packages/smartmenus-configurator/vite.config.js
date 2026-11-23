import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { defineConfig } from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import packageJson from './package.json'
import { getSriHashes } from './sri.js'

const nodeRequire = createRequire(import.meta.url)
const smartmenusDist = join(dirname(nodeRequire.resolve('smartmenus/package.json')), 'dist')

export default defineConfig(() => {
  return {
    base: `/${packageJson.version}`,
    build: {
      target: browserslistToEsbuild()
    },
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),

      quasar({
        sassVariables: 'src/css/quasar-variables.scss'
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define:  {
      '__APP_VERSION__': `'${packageJson.version}'`,
      // Integrity hashes of the files that the generated code loads from the CDN
      '__SRI__': JSON.stringify(getSriHashes(smartmenusDist))
    }
  }
})
