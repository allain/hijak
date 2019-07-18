import path from "path"
import fs from "fs-extra"
import which from "../lib/which"
import exec from "../lib/exec"
import ansicolors from "ansi-colors"
import { loadJson } from "../lib/load-file"
import { buildExpectedPath } from "../lib/target-utils"
import usageBuilder from "command-line-usage"
import Debug from "debug"

import syncDir from "../lib/sync-dirs"
import ensureHijacked from "../lib/ensure-hijacked"

const debug = Debug("hijak:run")

export default async function setup(program) {
  program.command("run <command>").action(action)
}

/**
 *
 * @param {object} args
 * @param {string[]} argv
 */
export async function action(args, argv) {
  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  const commandName = args._[3]
  if (!commandName) {
    console.error(ansicolors.red("command not given"))
    usage(args)
    return false
  }

  debug("running npm command %s", commandName)
  const buildDir = await ensureHijacked(projectDir)

  const escapePos = argv.indexOf("--")
  const npmArgs = escapePos >= 0 ? argv.slice(escapePos) : []

  // TODO: perform an update here if needed
  await prepareBuildDirForRun(buildDir, projectDir).catch(err => {
    console.error(err.message)
  })

  const stopSync = syncDir(process.cwd(), buildDir)

  const npmPath = await which("npm")
  const result = await exec(npmPath, ["run", commandName, ...npmArgs], {
    cwd: buildDir
  })

  await stopSync()
}

const ignoredRegex = /^(node_modules|package.json|package-lock.json|[.].*)$/

async function prepareBuildDirForRun(buildDir, projectDir) {
  const gitBin = await which("git")
  await exec(gitBin, ["reset", "--hard", "--quiet"], { cwd: buildDir })
  await exec(gitBin, ["clean", "-f", "--quiet"], { cwd: buildDir })

  const sourcePaths = (await fs.readdir(projectDir)).filter(
    p => !p.match(ignoredRegex)
  )
  for (const p of sourcePaths) {
    const srcPath = path.resolve(projectDir, p)
    const targetPath = path.resolve(buildDir, p)

    debug(`installing %s to %s`, p, targetPath)
    if (fs.pathExists(targetPath)) {
      await fs.remove(targetPath)
    }

    await fs.copy(srcPath, targetPath)
  }
}

export function usage(args) {
  const commandName = path.basename(args._[1])
  return console.log(
    usageBuilder([
      {
        header: "hijack run",
        content: "Runs an npm script using the hijacked project."
      },
      {
        header: "Usage",
        content: `\$ ${commandName} run [--project={underline projectDir}] <command> [options] [...args]`
      },
      {
        header: "Options",
        optionList: [
          {
            name: "help",
            description: "Display this usage guide.",
            type: Boolean
          },
          {
            name: "project",
            description:
              "Uses this as the context for running the commands. Defaults to the current directory.",
            type: String,
            typeLabel: "{underline dir}"
          }
        ]
      },
      {
        header: "Example",
        content: `\$ ${commandName} run test -- --watch`
      }
    ])
  )
}
