import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, "")
}

export function isEmpty(path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === ".git")
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  )
}

export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z\d\-~]+/g, "-")
}

export function attemptInitializeGit(rootDir: string) {
  try {
    console.log("Initialize git")
    console.log("......")
    execSync(`git init ${rootDir}`)
    execSync("git add .", {
      cwd: rootDir,
    })
    execSync("git commit --message='feat: Initialize project'", {
      cwd: rootDir,
    })
    execSync("npx -y husky install", { cwd: rootDir })
    console.log("successfully initialize git")
  } catch (error) {
    console.log(error)
  }
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}
