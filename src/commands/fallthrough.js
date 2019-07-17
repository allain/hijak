import path from "path"
import fs from "fs-extra"
import findLocalTarget from "../lib/find-local-target"
import which from "../lib/which"
import exec from "../lib/exec"
import { loadJson } from "../lib/load-file"
import syncDir from "../lib/sync-dirs"

export default async function setup(program) {
  program.command("*").action(action)
}

async function action(commandName, ...args) {
  const { parent } = args[args.length - 1]

  const npmArgs = parent.rawArgs.slice(2)

  const pkgJsonPath = path.resolve(process.cwd(), "package.json")
  const pkg = await loadJson(pkgJsonPath)
  if (!pkg.hijack)
    throw new Error("current package.json has not hijacked anything")

  const targetDir = await findLocalTarget(pkg.hijack.target)

  await prepareTargetDirForRun(targetDir)

  //const stopSync = syncDir(targetDir, process.cwd())

  const npmPath = await which("npm")
  const result = await exec(npmPath, [...npmArgs], {
    cwd: targetDir
  })

  //stopSync()
}

const ignoredRegex = /^(node_modules|package.json|package-lock.json|[.].*)$/
async function prepareTargetDirForRun(targetDir, projectDir = process.cwd()) {
  const sourcePaths = (await fs.readdir(projectDir)).filter(
    p => !p.match(ignoredRegex)
  )
  for (const p of sourcePaths) {
    const srcPath = path.resolve(projectDir, p)
    const targetPath = path.resolve(targetDir, p)

    console.log(`installing %s to %s`, p, targetPath)
    if (fs.pathExists(targetPath)) {
      // await fs.remove(targetPath)
    }

    // await fs.copy(srcPath, targetPath)
  }
}
