import pkgDir from "pkg-dir"

export default async function findLocalTarget(
  target,
  projectDir = process.cwd()
) {
  try {
    const localTargetPath = require.resolve(target, { paths: [projectDir] })
    return await pkgDir(localTargetPath)
  } catch (err) {
    return null
  }
}
