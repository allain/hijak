import path from "path"
import fs from "fs-extra"
import which from "../lib/which"
import exec from "../lib/exec"
import ansicolors from "ansi-colors"
import { loadJson } from "../lib/load-file"
import usageBuilder from "command-line-usage"
import Debug from "debug"
import sleep from "../lib/sleep"
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
  const npmPath = await which("npm")

  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  await fs.ensureDir(path.resolve(projectDir, "node_modules"))

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

  const buildPkg = await loadJson(path.resolve(buildDir, "package.json"))

  const typeDefs = Object.entries(buildPkg.devDependencies || {}).filter(
    ([name]) => name.match(/^@types\//)
  )

  const missingTypeDefs = typeDefs.filter(([depName]) => {
    return !fs.pathExistsSync(path.join(projectDir, "node_modules", depName))
  })

  if (missingTypeDefs.length) {
    const depArgs = missingTypeDefs.map(
      ([depName, semver]) => `${depName}@${semver}`
    )

    await exec(npmPath, ["install", "--silent", "--no-save", ...depArgs], {
      cwd: projectDir
    })
  }

  const pkg = await loadJson(path.resolve(projectDir, "package.json"))

  const missingBuildDeps = Object.entries({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  }).filter(([depName, semver]) => {
    try {
      require.resolve(depName, { paths: [buildDir] })
      return false
    } catch (err) {
      return true
    }
  })

  if (missingBuildDeps.length) {
    const depArgs = missingBuildDeps.map(
      ([depName, semver]) => `${depName}@${semver}`
    )

    await exec(npmPath, ["install", "--silent", "--no-save", ...depArgs], {
      cwd: buildDir
    })
  }

  const stopSync = syncDir(process.cwd(), buildDir)
  const result = await exec(npmPath, ["run", commandName, ...npmArgs], {
    cwd: buildDir
  })

  debug("waiting for last changes to sync")
  await sleep(500)

  await stopSync()

  // @ts-ignore
  return result.code === 0
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
