import fs from "fs-extra"
import path from "path"
import { loadJson } from "./load-file"

export default async function extractTargetName(targetDir) {
  const pkgJsonPath = path.join(targetDir, "package.json")
  if (!(await fs.pathExists(pkgJsonPath))) return null

  const pkg = await loadJson(pkgJsonPath)
  return pkg.name
}
