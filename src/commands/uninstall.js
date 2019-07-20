import * as path from "path"
import usageBuilder from "command-line-usage"
import HijakProject from "../HijakProject"

export async function action(args) {
  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  const hijakProject = new HijakProject(projectDir)
  await hijakProject.uninstall()

  return true
}

export function usage(args) {
  const commandName = path.basename(args._[1])
  console.log(
    usageBuilder([
      {
        header: "hijack uninstall",
        content:
          "Removes the hijak record from the project's package.json file."
      },
      {
        header: "Usage",
        content: `\$ ${commandName} uninstall [--project={underline projectDir}]`
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
              "Targets the project in which the uninstall should take place.",
            type: String,
            typeLabel: "{underline dir}"
          }
        ]
      }
    ])
  )
}
