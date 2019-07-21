export default async function freeCommand(hijakProject) {
  await hijakProject.free()

  return true
}
