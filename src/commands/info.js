export default async function infoCommand (hijakProject) {
  if (!hijakProject.gitUrl) {
    console.warn('project does not use hijak')
    return false
  }

  // A header is printed before it gets here

  return true
}
