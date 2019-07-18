import { loadJson, saveJson } from "../lib/load-file"
import * as path from "path"
import ensureHijacked from "../lib/ensure-hijacked"
import Debug from "debug"

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
  if (target.match(/^git@/)) {
  } else {
    throw new Error("only git targets are supported: " + target)
  }

  if (projectDir[0] === ".")
    projectDir = path.resolve(process.cwd(), projectDir)

  const pkgJsonPath = path.resolve(projectDir || process.cwd(), "package.json")
  const pkg = await loadJson(pkgJsonPath)

  debug("adding hijack config into package.json")
  pkg.hijack = pkg.hijack || {}
  pkg.hijack.repo = target
  await saveJson(pkgJsonPath, pkg)

  debug("hijacking", target, "for", projectDir)

  await ensureHijacked(projectDir)
}

export async function help(target, options) {
  console.log()
  console.log("EXTRA HELP")
}
