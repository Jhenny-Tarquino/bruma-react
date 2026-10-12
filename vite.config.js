import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function githubPagesSpaFallback() {
  let outputDirectory

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await copyFile(
        resolve(outputDirectory, 'index.html'),
        resolve(outputDirectory, '404.html'),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bruma-react/' : '/',
  plugins: [react(), githubPagesSpaFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        requestService: resolve(import.meta.dirname, 'solicitar-servicio.html'),
      },
    },
  },
}))
