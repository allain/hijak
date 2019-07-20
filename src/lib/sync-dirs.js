import chokidar from "chokidar"
import fs from "fs-extra"
import path from "path"

import Debug from "debug"
const debug = Debug("hijak:sync-dirs")

export default function syncDirectories(srcPath, buildPath) {
  // used to keep infinite update loops from happening
  const lastChanges = {}

  // Start watching the build directory for things that the build is modifying and push them to the srcPath
  const watcher = chokidar.watch([srcPath, buildPath], {
    alwaysStat: true,
    ignoreInitial: true,
    ignored: "node_modules",
    persistent: false,
    awaitWriteFinish: true
  })

  watcher.on("all", async (event, fromPath) => {
    const isSrcChange = !fromPath.startsWith(buildPath)
    const relativePath = path.relative(
      isSrcChange ? srcPath : buildPath,
      fromPath
    )
    const toPath = path.resolve(isSrcChange ? buildPath : srcPath, relativePath)

    const lastFromChange = lastChanges[fromPath] || 0
    const lastToChange = lastChanges[toPath] || 0

    const now = (lastChanges[fromPath] = Date.now())

    // Can this be done better? Need to hash files?
    if (
      lastFromChange &&
      lastToChange &&
      now - lastFromChange < 100 &&
      now - lastToChange < 100
    ) {
      debug("bailing on cyclic propagation %s => %s", fromPath, toPath)
      return
    }

    try {
      switch (event) {
        case "add":
          debug("creating %s", toPath)
          await fs.ensureDir(path.dirname(toPath))
          await fs.copyFile(fromPath, toPath)
          break
        case "change":
          await fs.ensureDir(path.dirname(toPath))
          debug("updating src %s", toPath)
          await fs.copyFile(fromPath, toPath)
          break
        case "addDir":
          debug("adding directory %s", toPath)
          if (await fs.pathExists(toPath)) {
            await fs.remove(toPath)
          }
          fs.mkdir(toPath)
          break
        case "unlink":
          debug("removing %s", toPath)
          fs.remove(toPath)
          break
        case "unlinkDir":
          debug("removing directory %s", toPath)
          if (await fs.pathExists(toPath)) {
            await fs.remove(toPath)
          }
      }
    } catch (err) {
      console.error(err.message)
    }
  })

  return async () => {
    debug("stopping directory watcher")
    watcher.close()
  }
}
