import * as path from "path"
import usageBuilder from "command-line-usage"
import HijakProject from "../HijakProject"

export async function action(args) {
  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()

  const hijakProject = new HijakProject(projectDir)

  if (hijakProject.gitUrl) {
    console.log("hijacked git repo:", hijakProject.gitUrl)
    console.log("build directory:", hijakProject.buildPath)
  } else {
    console.warn("project does not use hijak")
  }

  return true
}

export function usage(args) {
  const commandName = path.basename(args._[1])
  console.log(
    usageBuilder([
      {
        header: "hijack info",
        content: "Displays some information about a hijak setup"
      },
      {
        header: "Usage",
        content: `\$ ${commandName} info [--project={underline projectDir}]`
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
