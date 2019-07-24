import fs from "fs-extra"
import path from "path"

/**
 * Returns an array of changes to be applied to the projectDir from the buildDir.
 *
 * If files are newer in the build they are moved over to the projectDir
 * @param {string} buildDir
 * @param {string} projectDir
 */
export default function dirDiff(buildDir, projectDir, since = 0) {
  const targetStatTree = collectStatTree(buildDir)
  console.log(targetStatTree)
  copyNewer(targetStatTree, projectDir)
}

function copyNewer(statItems, projectDir) {
  for (const { stat, path, children } of statItems) {
    const itemProjectPath = path.join(projectDir, path)
    console.log(itemProjectPath)
    if (children) {
      copyNewer(children, projectDir)
    }
  }
}

function collectStatTree(dir, since) {
  const files = fs.readdirSync(dir)
  return files
    .map(f => {
      const currentPath = path.join(dir, f)
      const pathStat = fs.statSync(currentPath)
      if (pathStat.mtime.getTime() < since) return false
      if (pathStat.isDirectory()) {
        return {
          stat: pathStat,
          path: currentPath,
          children: collectStatTree(currentPath, since)
        }
      } else {
        return { stat: pathStat, path: currentPath }
      }
    })
    .filter(Boolean)
}
