import path from "node:path"
import typescript from "@rollup/plugin-typescript"
import { fileURLToPath } from "node:url"
import { defineConfig } from "rollup"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const targetDir = "build"

export default () =>
  defineConfig({
    input: "src/app.ts",
    output: {
      format: "es",
      dir: targetDir,
    },
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      nodeResolve(),
      commonjs(),
      terser(),
    ],
  })
