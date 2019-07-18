import path from "path"
import fs from "fs-extra"
import which from "../lib/which"
import exec from "../lib/exec"
import { loadJson } from "../lib/load-file"
import { buildExpectedPath } from "../lib/target-utils"
import Debug from "debug"

import syncDir from "../lib/sync-dirs"
import ensureHijacked from "../lib/ensure-hijacked"

const debug = Debug("hijack:run")

export default async function setup(program) {
  program.command("run <command>").action(action)
}

export async function action(commandName, ...args) {
  debug("running command %s", commandName)
  const projectDir = process.cwd()
  const targetDir = await ensureHijacked(projectDir)

  const { parent } = args[args.length - 1]

  const npmArgs = parent.rawArgs.slice(2)

  // TODO: perform an update here if needed
  await prepareTargetDirForRun(targetDir, projectDir)

  const stopSync = syncDir(process.cwd(), targetDir)

  const npmPath = await which("npm")
  const result = await exec(npmPath, [...npmArgs], {
    cwd: targetDir
  })

  stopSync()
}

const ignoredRegex = /^(node_modules|package.json|package-lock.json|[.].*)$/
async function prepareTargetDirForRun(targetDir, projectDir = process.cwd()) {
  const gitBin = await which("git")
  await exec(gitBin, ["reset", "--hard", "--quiet"], { cwd: targetDir })

  const sourcePaths = (await fs.readdir(projectDir)).filter(
    p => !p.match(ignoredRegex)
  )
  for (const p of sourcePaths) {
    const srcPath = path.resolve(projectDir, p)
    const targetPath = path.resolve(targetDir, p)

    debug(`installing %s to %s`, p, targetPath)
    if (fs.pathExists(targetPath)) {
      await fs.remove(targetPath)
    }

    await fs.copy(srcPath, targetPath)
  }
}
