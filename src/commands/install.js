import { loadJson, saveJson } from "../lib/load-file"
import * as path from "path"
import ensureHijacked from "../lib/ensure-hijacked"
import usageBuilder from "command-line-usage"
import Debug from "debug"

const debug = Debug("hijak:install")

export async function action(args) {
  const target = args._[3]

  if (!target) {
    console.error("a git repo to hijack must be given")
    return usage(args)
  }

  if (target.match(/^git@/)) {
    console.log("hijacking", target)
  } else {
    throw new Error("only git targets are supported: " + target)
  }

  const projectDir = args.project
    ? path.resolve(process.cwd(), args.project)
    : process.cwd()
  const pkgJsonPath = path.resolve(projectDir, "package.json")
  const pkg = await loadJson(pkgJsonPath)

  debug("adding hijack config into package.json")
  pkg.hijak = pkg.hijak || {}
  pkg.hijak.repo = target
  await saveJson(pkgJsonPath, pkg)

  debug("hijacking", target, "for", projectDir)

  await ensureHijacked(projectDir)

  return true
}

export function usage(args) {
  const commandName = path.basename(args._[1])
  console.log(
    usageBuilder([
      {
        header: "hijack install",
        content:
          "Hijacks the passed git repo as the build pipeline for the project."
      },
      {
        header: "Usage",
        content: `\$ ${commandName} install [--project={underline projectDir}] <git-url>`
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
            description: "Installs the hijack into this project directory.",
            type: String,
            typeLabel: "{underline dir}"
          }
        ]
      },
      {
        header: "Example",
        content: `\$ ${commandName} install git@github.com:allain/template-npm-project.git`
      }
    ])
  )
}
