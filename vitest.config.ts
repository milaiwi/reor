import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    exclude: ['**/node_modules/react-native-svg/**', '**/node_modules/@tamagui/**', '**/node_modules/react-native/**'],
    deps: {
      optimizer: {
        web: {
          include: ['react-native-svg']
        }
      }
    },
    environment: 'jsdom',
    setupFiles: ['./src/components/Editor/__tests__/setup']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@blocknote': path.resolve(__dirname, './src/lib/blocknote'),
      '@blocknote/core': path.resolve(__dirname, './src/lib/blocknote/core'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
})