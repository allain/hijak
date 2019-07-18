import path from "path"
import ansicolors from "ansi-colors"

import minimist from "minimist"
import usageBuilder from "command-line-usage"

import * as install from "./commands/install"
import * as run from "./commands/run"

import { loadJsonSync, loadJson } from "./lib/load-file"

const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))
const commands = { install, run }

export default async function main(argv = process.argv) {
  const args = minimist(argv)
  const actualParams = args._.slice(2)
  if (actualParams.length === 0) return usage(args)
  const commandName = actualParams[0]
  const command = commands[commandName]

  if (!command) {
    console.error(ansicolors.bold.red("unknown command:"), commandName)
    return usage(args)
  }

  if (args.help) {
    return command.usage(args)
  }

  const success = await command.action(args, argv)
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
        header: commandName + "v" + pkg.version,
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
            name: "install",
            synopsis:
              "Hijacks the given git repo as the build system for the current project."
          },
          {
            name: "run",
            synopsis: "Runs an npm script using the hijacked project."
          }
        ]
      }
    ])
  )
}

// hijack(program)
// run(program)

// program.parse(process.argv)
