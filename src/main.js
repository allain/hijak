import path from "path"
import ansicolors from "ansi-colors"
import HijakProject from "./HijakProject"
import minimist from "minimist"
import usageBuilder from "command-line-usage"
import commands from "./commands/index"
import { loadJsonSync } from "./lib/load-file"
import Debug from "debug"

const debug = Debug("hijak")

export default async function main(argv = process.argv) {
  const args = minimist(argv, {
    boolean: ["quiet"],
    default: {
      quiet: false
    }
  })

  const actualParams = args._.slice(2)

  if (args.version) {
    const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))
    console.log(pkg.version)
    process.exit(0)
  }

  if (actualParams.length === 0) return usage(args)

  let commandName = actualParams[0]
  if (commandName.match(/^git@/)) {
    // Then the user is doing "hijak git@git..." so let's inject an "hijack" command
    args._ = ["hijack", ...args._]
    commandName = "hijack"
  }

  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  const hijakProject = new HijakProject(projectDir, { quiet: args.quiet })

  const command = commands[commandName] || commands.npm

  const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))

  if (!args.quiet) {
    console.log(
      ansicolors.green("hijak"),
      `v${pkg.version}`,
      ansicolors.blue(hijakProject.gitUrl),
      "in",
      ansicolors.whiteBright(hijakProject.buildPath)
    )
  }

  const succeeded = await command(hijakProject, args, argv).then(
    () => true,
    err => {
      console.error(ansicolors.bold.red("ERROR:"), err.message)
      debug(err)
      return false
    }
  )

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
            name: "hijack",
            synopsis:
              "Hijacks the given git repo as the build system for the current project."
          },
          {
            name: "free",
            synopsis: "Removes the hijak config from the project."
          },
          {
            name: "update",
            synopsis: "Reset the build and pulls anew from the hijacked repo."
          }
        ]
      }
    ])
  )
}
