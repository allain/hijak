export default async function install(hijakProject, args) {
  const gitUrl = args._[3]

  if (!gitUrl) throw new Error("a git url to hijack must be given")

  if (!gitUrl.match(/^git@/))
    throw new Error("only git targets are supported: " + gitUrl)

  console.log("hijacking", gitUrl)

  await hijakProject.install(gitUrl)
  return true
}
