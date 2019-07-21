export default async function uninstallCommand(hijakProject) {
  await hijakProject.uninstall()

  return true
}
