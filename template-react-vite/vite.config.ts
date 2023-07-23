import { defineConfig } from "vite"
import fs from "fs"
import path from "path"
import react from "@vitejs/plugin-react-swc"
import { compression } from "vite-plugin-compression2"
import { visualizer } from "rollup-plugin-visualizer"

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    compression({
      include: /\.(js|css|html|svg)$/,
      threshold: 1024,
    }),
    process.env.BUNDLE_ANALYZER &&
      visualizer({
        template: "treemap", // or sunburst
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: "stats.html",
      }),
  ].filter(Boolean),
  css: {
    preprocessorOptions: {
      less: {
        math: "parens-division",
      },
    },
  },
  server: {
    port: 8080,
    open: true,
  },
  build: {
    outDir: "build",
  },
}))
