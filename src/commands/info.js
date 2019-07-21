export default async function infoCommand(hijakProject) {
  if (!hijakProject.gitUrl) {
    console.warn("project does not use hijak")
    return false
  }

  console.log("hijacked git repo:", hijakProject.gitUrl)
  console.log("build directory:", hijakProject.buildPath)
  return true
}
