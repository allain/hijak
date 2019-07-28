import fs from "fs-extra"
import path from "path"

export default async function hijackCommand(hijakProject, args) {
  const repoSpec = args._[3]

  if (!repoSpec) throw new Error("a git url to hijack must be given")

  if (!repoSpec.match(/^git@/) && !repoSpec.match(/^[.]|\//g))
    throw new Error("invalid git repo spec: " + repoSpec)

  console.log("hijacking", repoSpec)
  await hijakProject.hijack(repoSpec)
  await fs.ensureSymlink(
    hijakProject.buildPath,
    path.join(hijakProject.projectDir, ".hijak")
  )
}
