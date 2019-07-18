import fs from "fs-extra"
import path from "path"
import { buildExpectedPath } from "../lib/target-utils"
import { loadJson, loadText, saveText } from "../lib/load-file"
import exec from "../lib/exec"
import which from "../lib/which"
import Debug from "debug"

const debug = Debug("hijak")

export default async function ensureHijacked(projectDir) {
  const pkg = await loadJson(path.resolve(projectDir, "package.json"))
  const target = pkg.hijak.repo
  if (!target) throw new Error("project has not been hijacked yet")

  // await ensureHijakGitIgnored(projectDir)

  debug("checking for installed hijak target %s", target)
  const targetDir = buildExpectedPath(target, projectDir)
  if (await fs.pathExists(targetDir)) {
    debug("found %s", target)
  } else {
    console.warn(`${target} not found at ${targetDir}. installing`)

    debug("installing local target")
    const gitBin = which("git")
    await exec("git", ["clone", target, targetDir], { cwd: projectDir })

    debug("installing local target deps")
    await exec("npm", ["install", "--only-deps"], { cwd: targetDir })
  }

  return targetDir
}

// TODO this is spamming
async function ensureHijakGitIgnored(projectDir) {
  const gitIgnorePath = path.join(projectDir, ".gitignore")
  if (!(await fs.pathExists(gitIgnorePath))) return

  const ignored = await loadText(gitIgnorePath)
  //! TODO Make this more intelligent
  if (!ignored.includes(".hijak")) {
    // Need to add .hijak to .gitignore
    saveText(gitIgnorePath, ignored.trim() + "\n.hijak/\n")
  }
}
