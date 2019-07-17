import { loadJson, saveJson } from "../lib/load-file"
import * as path from "path"
import Debug from "debug"
import fs from "fs-extra"
import findLocalTarget from "../lib/find-local-target"
import extractTargetName from "../lib/extract-target-name"

import exec from "../lib/exec"
import which from "../lib/which"

const debug = Debug("hijack")

export default function setup(program) {
  program
    .command("hijack <target> [projectDir]")
    .usage("[options] <target>")
    .action((...args) => action(...args).catch(err => console.error(err)))
    .description("hijacks the target's build pipeline")
    .on("--help", help)
}

export async function action(target, projectDir = process.cwd(), options) {
  let targetName = target
  // relative path
  if (target[0] === ".") {
    target = path.resolve(process.cwd(), target)
    targetName = await extractTargetName(target)
  }

  if (projectDir[0] === ".")
    projectDir = path.resolve(process.cwd(), projectDir)

  const pkgJsonPath = path.resolve(projectDir || process.cwd(), "package.json")
  const pkg = await loadJson(pkgJsonPath)

  console.log("hijacking", target, "into", projectDir)

  debug("checking for installed hijack target %s", target)

  let installedHijackPath = await findLocalTarget(targetName, projectDir)
  if (installedHijackPath) {
    debug("found %s at %s", targetName, installedHijackPath)
  } else {
    console.warn(`${targetName} not found. installing`)
    installedHijackPath = await installHijackTarget(target, projectDir)
  }

  debug("adding hijack config into package.json")
  pkg.hijack = pkg.hijack || {}
  pkg.hijack.target = targetName
  await saveJson(pkgJsonPath, pkg)
}

async function installHijackTarget(targetName, projectDir) {
  const npmPath = await which("npm")
  const result = await exec(npmPath, ["install", targetName, "--silent"], {
    cwd: projectDir
  })
  if (result.exitCode !== 0) {
    throw new Error("unable to install hijack")
  }

  const localTarget = await findLocalTarget(targetName, projectDir)

  debug("installing local target deps")
  const installTargetDevDeps = await exec(
    npmPath,
    ["install", "--only", "dev"],
    {
      cwd: localTarget
    }
  )

  await installTargetDevDeps
  return localTarget
}

export async function help(target, options) {
  console.log()
  console.log("EXTRA HELP")
}
