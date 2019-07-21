import path from "path"
import ansicolors from "ansi-colors"
import HijakProject from "./HijakProject"
import minimist from "minimist"
import usageBuilder from "command-line-usage"
import commands from "./commands/index"

import { loadJsonSync } from "./lib/load-file"

const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))

export async function main(argv = process.argv) {
  const args = minimist(argv)
  const actualParams = args._.slice(2)

  if (args.version) {
    console.log(pkg.version)
    process.exit(0)
  }

  if (actualParams.length === 0) return usage(args)

  let commandName = actualParams[0]
  if (commandName.match(/^git@/)) {
    // Then the user is doing "hijak git@git..." so let's inject an "install" command
    args._ = ["install", ...args._]
    commandName = "install"
  }

  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  const hijakProject = new HijakProject(projectDir)

  const command = commands[commandName]

  const succeeded = await (command
    ? command(hijakProject, args).then(
        () => true,
        err => {
          console.error(ansicolors.bold.red("ERROR:"), err.message)
          console.error(err)
          return false
        }
      )
    : // passthrough to hijakProject's npm runner
      hijakProject.npm(argv.slice(2)))

  process.exit(succeeded ? 0 : 1)
}

if (module.parent === null) {
  main().catch(err => {
    console.error(err)
  })
}

export function usage(args) {
  const commandName = path.basename(args._[1])
  console.log(
    usageBuilder([
      {
        header: commandName,
        content: "A tool for hijacking build pipelines for the greater good."
      },
      {
        header: "Usage",
        content: `\$ ${commandName} <command> [options]`
      },
      {
        header: "Commands",
        content: [
          {
            name: "info",
            synopsis: "Displays information about a project's hijak config"
          },
          {
            name: "install",
            synopsis:
              "Hijacks the given git repo as the build system for the current project."
          },
          {
            name: "run",
            synopsis: "Runs an npm script using the hijacked project."
          },
          {
            name: "uninstall",
            synopsis: "Removes the hijack of the target project."
          }
        ]
      }
    ])
  )
}
