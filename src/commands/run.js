import path from "path"
import which from "../lib/which"
import ansicolors from "ansi-colors"
import usageBuilder from "command-line-usage"
import Debug from "debug"
import HijakProject from "../HijakProject"

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

  const hijakProject = new HijakProject(projectDir)

  const commandName = args._[3]
  if (!commandName) {
    console.error(ansicolors.red("command not given"))
    usage(args)
    return false
  }

  debug("running npm command %s", commandName)

  const escapePos = argv.indexOf("--")
  const npmArgs = escapePos >= 0 ? argv.slice(escapePos) : []
  return hijakProject.run([commandName, ...npmArgs])
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
