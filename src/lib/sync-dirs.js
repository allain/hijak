import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'
import sleep from './sleep'
import { loadTextSync } from './load-file'
import globby from 'globby'
import hasha from 'hasha'
// import dirDiff from "./dir-diff"

const debug = Debug('hijak:sync-dirs')

export default async function syncDirectories (srcPath, buildPath) {
  const gitIgnorePath = path.resolve(srcPath, '.gitignore')
  let safeToDelete = path => false
  if (fs.pathExistsSync(gitIgnorePath)) {
    const ignorePatterns = loadTextSync(gitIgnorePath)
      .split(/[\r\n]+/g)
      .filter(Boolean)
    safeToDelete = globby.gitignore.sync({ ignore: ignorePatterns })
  } else {
    console.warn(
      '.gitignore not found, hijak will ignore all deletions from build directory'
    )
  }

  // used to keep infinite update loops from happening
  const lastChanges = {}

  const ignoredPathSegments = ['.git', '.hijak', 'node_modules', 'package.json']

  // Start watching the build directory for things that the build is modifying and push them to the srcPath
  const watcher = chokidar.watch([srcPath, buildPath], {
    alwaysStat: true,
    atomic: true,
    awaitWriteFinish: {
      pollInterval: 100,
      stabilityThreshold: 500
    },
    ignoreInitial: true,
    ignored: p => {
      const relativePath = p.startsWith(srcPath)
        ? path.relative(srcPath, p)
        : path.relative(buildPath, p)

      const parts = relativePath.split(path.sep)
      return ignoredPathSegments.some(pathPart => parts.includes(pathPart))
    },
    persistent: false
  })

  let lastChange = Date.now()

  let processing = Promise.resolve()

  watcher.on('all', (event, fromPath) => {
    lastChange = Date.now()
    processing = processing.then(() => process(event, fromPath))
  })

  debug('watching %s <=> %s', srcPath, buildPath)

  async function process (event, fromPath) {
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
      debug('bailing on cyclic propagation %s => %s', fromPath, toPath)
      return
    }

    try {
      switch (event) {
        case 'add':
        case 'change':
          await fs.ensureDir(path.dirname(toPath))
          if (await fs.pathExists(toPath)) {
            const fromStat = fs.statSync(fromPath)
            const toStat = fs.statSync(toPath)
            if (fromStat.size !== toStat.size) {
              debug(
                'updating because size is different %d %d',
                fromStat.size,
                toStat.size
              )
              await fs.copyFile(fromPath, toPath)
            } else {
              const [fromHash, toHash] = await Promise.all([
                hasha.fromFile(fromPath),
                hasha.fromFile(toPath)
              ])

              if (fromHash !== toHash) {
                debug(
                  'updating because hash is different %s %s',
                  fromHash,
                  toHash
                )
                await fs.copyFile(fromPath, toPath)
              }
            }
          } else {
            debug('creating src %s', toPath)
            await fs.ensureDir(path.dirname(toPath))
            await fs.copyFile(fromPath, toPath)
          }

          break
        case 'addDir':
          debug('adding directory %s', toPath)
          if (!(await fs.pathExists(toPath))) {
            // await fs.remove(toPath)
            await fs.mkdirp(toPath)
          }
          break
        case 'unlink':
          if (isSrcChange || safeToDelete(path.relative(buildPath, fromPath))) {
            debug('removing file %s', toPath)
            if (fs.pathExists(toPath)) {
              await fs.remove(toPath)
            }
          } else {
            console.warn('ignoring unsafe file deletion:', toPath)
          }
          break
        case 'unlinkDir':
          if (isSrcChange || safeToDelete(path.relative(buildPath, fromPath))) {
            debug('removing directory %s', toPath)
            if (await fs.pathExists(toPath)) {
              await fs.remove(toPath)
            }
          } else {
            console.warn('ignoring unsafe directory deletion:', toPath)
          }
      }
    } catch (err) {
      console.error(err)
    }
  }

  debug('waiting for watcher to be ready')
  // Wait for watcher to be ready
  await new Promise((resolve, reject) => {
    watcher.once('ready', () => resolve())
    watcher.once('error', reject)
  })

  debug('returning stopper')

  return async () => {
    debug('stopping directory watcher')

    await Promise.race([
      new Promise(resolve => {
        const waitForQuietFsId = setInterval(() => {
          debug('fs still active')
          if (Date.now() - lastChange > 1000) {
            clearInterval(waitForQuietFsId)
            resolve()
          }
        }, 250)
      }),
      sleep(10000).catch(err => {
        console.error(
          'timedout waiting for filesytstem to quiet, terminating anyhow'
        )
      })
    ])

    watcher.close()
    debug('fs inactive')

    await processing
    debug('done processing fs change queue')

    // TODO: Failsafe copy of all changed files from build dir to project dir
    // dirDiff(buildPath, srcPath)
  }
}
