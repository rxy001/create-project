import prompts from "prompts"
import fs from "node:fs"
import path from "node:path"
import minimist from "minimist"
import { fileURLToPath } from "node:url"
import { reset, red, yellow, green } from "kolorist"
import {
  formatTargetDir,
  isValidPackageName,
  toValidPackageName,
  isEmpty,
  attemptInitializeGit,
  copy,
} from "./utils.ts"

const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
}

const defaultTargetDir = "my-project"

const argv = minimist<{
  t?: string
  template?: string
}>(process.argv.slice(2))

const cwd = process.cwd()

const TEMPLATES = [
  { name: "lib", display: "Lib", color: yellow },
  {
    name: "react-vite",
    display: "React-Vite",
    color: green,
  },
]

const TEMPLATE_NAMES = TEMPLATES.map((template) => template.name)

async function app() {
  const argTargetDir = formatTargetDir(argv._[0])

  let targetDir = argTargetDir || defaultTargetDir

  const argTemplate = argv.template || argv.t

  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir

  let response: prompts.Answers<
    "projectName" | "overwrite" | "packageName" | "template"
  >
  try {
    response = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
          name: "overwrite",
          message: () =>
            `${
              targetDir === "."
                ? "Current directory"
                : `Target directory "${targetDir}"`
            } is not empty. Remove existing files and continue?`,
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(`${red("✖")} Operation cancelled`)
            }
            return null
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "Invalid package.json name",
        },
        {
          type:
            argTemplate && TEMPLATE_NAMES.includes(argTemplate)
              ? null
              : "select",
          name: "template",
          message:
            typeof argTemplate === "string" &&
            !TEMPLATE_NAMES.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `,
                )
              : reset("Select a template:"),
          initial: 0,
          choices: TEMPLATES.map((template) => {
            const frameworkColor = template.color
            return {
              title: frameworkColor(template.display || template.name),
              value: template,
            }
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red("✖")} Operation cancelled`)
        },
      },
    )
  } catch (cancelled: any) {
    console.log(cancelled.message)
    return
  }

  const { template, overwrite, packageName } = response

  const root = path.join(cwd, targetDir)

  if (overwrite) {
    fs.rmSync(root, { recursive: true, force: true })
  }

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../../",
    `template-${template.name}`,
  )

  const write = (file: string, copyDir: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(copyDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file, templateDir)
  }

  const commonTemplateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../../",
    `template-common`,
  )

  const commonFiles = fs.readdirSync(commonTemplateDir)

  for (const file of commonFiles) {
    write(file, commonTemplateDir)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8"),
  )

  pkg.name = `@x1ngYu/${packageName || getProjectName()}`

  write("package.json", templateDir, `${JSON.stringify(pkg, null, 2)}\n`)

  const cdProjectName = path.relative(cwd, root)

  attemptInitializeGit(cdProjectName)

  console.log(`\nDone. Now run:\n`)

  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
      }`,
    )
  }
  console.log("  npm install  ")
  console.log()
}

app()
