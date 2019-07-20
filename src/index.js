import path from "path"
import ansicolors from "ansi-colors"

import minimist from "minimist"
import usageBuilder from "command-line-usage"

import * as info from "./commands/info"
import * as install from "./commands/install"
import * as run from "./commands/run"
import * as uninstall from "./commands/uninstall"

import { loadJsonSync } from "./lib/load-file"

const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))

const buildRunSynonym = scriptName => ({
  action(args, argv) {
    // mutation
    args._.splice(2, 1, "run", scriptName)
    return run.action(args, argv)
  },
  usage() {
    console.log("alias for", ansicolors.bold(`hijak run ${scriptName}`))
  }
})

const commands = {
  info,
  install,
  run,
  uninstall,
  start: buildRunSynonym("start"),
  test: buildRunSynonym("test")
}

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
  const command = commands[commandName]

  if (!command) {
    console.error(
      ansicolors.bold.red("ERROR: "),
      "unknown command",
      commandName
    )
    return usage(args)
  }

  if (args.help) {
    return command.usage(args)
  }

  const success = await command.action(args, argv).catch(err => {
    console.error(ansicolors.bold.red("ERROR:"), err.message)
    console.error(err)
  })

  if (success === false) {
    process.exit(1)
  } else {
    process.exit(0)
  }

  // console.log(JSON.stringify(args))
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
