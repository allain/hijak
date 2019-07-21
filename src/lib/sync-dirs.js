import chokidar from "chokidar"
import fs from "fs-extra"
import path from "path"
import sleep from "./sleep"
import Debug from "debug"
import { loadTextSync } from "./load-file"
import globby from "globby"

const debug = Debug("hijak:sync-dirs")

export default function syncDirectories(srcPath, buildPath) {
  const changes = []

  const gitIgnorePath = path.resolve(srcPath, ".gitignore")
  let safeToDelete = path => false
  if (fs.pathExistsSync(gitIgnorePath)) {
    const ignorePatterns = loadTextSync(gitIgnorePath)
      .split(/[\r\n]+/g)
      .filter(Boolean)
    safeToDelete = globby.gitignore.sync({ ignore: ignorePatterns })
  } else {
    console.warn(
      ".gitignore not found, hijak will ignore all deletions from build directory"
    )
  }

  // used to keep infinite update loops from happening
  const lastChanges = {}

  // Start watching the build directory for things that the build is modifying and push them to the srcPath
  const watcher = chokidar.watch([srcPath, buildPath], {
    alwaysStat: true,
    atomic: true,
    ignoreInitial: true,
    ignored: "node_modules",
    persistent: false
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
          await fs.mkdir(toPath)
          break
        case "unlink":
          if (isSrcChange || safeToDelete(path.relative(buildPath, fromPath))) {
            debug("removing file %s", toPath)
            await fs.remove(toPath)
          } else {
            console.warn("ignoring unsafe file deletion:", toPath)
          }
          break
        case "unlinkDir":
          if (isSrcChange || safeToDelete(path.relative(buildPath, fromPath))) {
            debug("removing directory %s", toPath)
            if (await fs.pathExists(toPath)) {
              await fs.remove(toPath)
            }
          } else {
            console.warn("ignoring unsafe directory deletion:", toPath)
          }
      }
    } catch (err) {
      console.error(err.message)
    }
  })

  return async () => {
    debug("stopping directory watcher")
    watcher.close()

    // The atomic: true option means there's a built-in 100ms delay before a file
    // write (delete + write of some editors) is emitted as a change event.
    // So we need to wait an amount of time before all changes are actually seen.
    debug("sleeping for a bit to allow all changes to settle")
    await sleep(250)
  }
}
