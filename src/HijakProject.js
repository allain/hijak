import os from "os"
import {
  loadJson,
  loadJsonSync,
  saveJson,
  loadText,
  saveText
} from "./lib/load-file"
import Debug from "debug"
import fs from "fs-extra"
import path from "path"
import exec from "./lib/exec"
import syncDirs from "./lib/sync-dirs"
import hashString from "./lib/hash-string"
import { EventEmitter } from "events"
import Burden from "./lib/Burden"
import readPkgUp from "read-pkg-up"
import semver from "semver"

const debug = Debug("hijak")

export default class HijakProject extends EventEmitter {
  constructor(projectDir, options = {}) {
    super()
    this.projectDir = projectDir
    this.options = options
  }

  get installed() {
    return !!loadJsonSync(path.join(this.projectDir, "package.json")).hijak
  }

  get gitUrl() {
    const hijak = loadJsonSync(path.join(this.projectDir, "package.json")).hijak
    return hijak ? hijak.repo : null
  }

  get buildPath() {
    return path.join(
      os.homedir(),
      ".hijak",
      `project-${hashString(this.projectDir)}`
    )
  }

  async _updatePkg(fn) {
    const pkgJsonPath = path.resolve(this.projectDir, "package.json")
    const pkg = await loadJson(pkgJsonPath)
    const newPkg = fn(pkg) || pkg
    await saveJson(pkgJsonPath, newPkg)
  }

  async _loadProjectPackage() {
    const pkgJsonPath = path.resolve(this.projectDir, "package.json")
    return await loadJson(pkgJsonPath)
  }

  async hijack(gitUrl) {
    debug("adding hijack config into package.json")
    await this._updatePkg(pkg => ({ ...pkg, hijak: { repo: gitUrl } }))

    if (fs.pathExists(this.buildPath)) {
      debug("removing %s", this.buildPath)
      await fs.remove(this.buildPath)
    }

    await this.prepare()
  }

  async free() {
    if (fs.pathExists(this.buildPath)) {
      debug("removing %s", this.buildPath)
      await fs.remove(this.buildPath)
    }

    await this._updatePkg(pkg => {
      delete pkg.hijak
    })
  }

  async npm(npmArgs) {
    if (!this.installed) throw new Error("project does not use hijak")

    const lockFilePath = path.join(
      path.dirname(this.buildPath),
      path.basename(this.buildPath) + ".lock"
    )

    const release = await Burden.bear(
      lockFilePath,
      () => syncDirs(process.cwd(), this.buildPath),
      () => this.prepare()
    )

    const childProcess = exec("npm", npmArgs, {
      cwd: this.buildPath,
      quiet: this.options.quiet
    })

    return childProcess.then(
      () => {
        debug("completed")
        return release()
      },
      async exitCode => {
        debug("completed with exit code %s", exitCode)
        await release()
        throw exitCode
      }
    )
  }

  async update() {
    // TODO: actually do a diff here
    if (await fs.pathExists(this.buildPath)) {
      await fs.remove(this.buildPath)
    }

    await this.prepare()
  }

  async needsPrepare() {
    const hashPath = this.buildPath + ".hash"
    if (!(await fs.pathExists(hashPath))) return true

    const oldHash = await loadText(hashPath)
    const newHash = await this.computeHash()
    return oldHash !== newHash
  }

  async computeHash() {
    // uses the modification time of package.json as the hash forn own
    const fstat = await fs.stat(path.resolve(this.projectDir, "package.json"))
    return "" + fstat.mtimeMs
  }

  async prepare() {
    if (!this.installed) throw new Error("project does not use hijack")

    if (false && !this.needsPrepare()) {
      debug("skipping unnecessary prepare")
      return
    }

    const pkg = await this._loadProjectPackage()

    const gitUrl = pkg.hijak.repo

    await fs.ensureDir(path.resolve(this.projectDir, "node_modules"))
    if (!(await fs.pathExists(this.buildPath))) {
      await this._createBuildDir(gitUrl)
    }

    const buildPkg = await loadJson(path.join(this.buildPath, "package.json"))

    console.log("installing deps on buildDir")
    await this._installMissingDepsOnBuildDir(buildPkg)

    await this._patchBuildWithProject()

    await this._installTypePackagesToProject()

    console.log("installing project deps on buildDir")
    await this._installMissingDepsOnBuildDir(pkg)

    const hashPath = this.buildPath + ".hash"
    await saveText(hashPath, this.computeHash())
  }

  async _createBuildDir(gitUrl) {
    await exec("git", ["clone", gitUrl, this.buildPath], {
      cwd: this.projectDir,
      quiet: this.options.quiet
    })
  }

  async _installMissingDeps(deps, targetPath) {
    const missingDeps = deps.filter(([depName, versionSpec]) => {
      const pkgPath = path.resolve(
        targetPath,
        "node_modules",
        depName.split("/").join(path.sep),
        "package.json"
      )
      if (!fs.pathExistsSync(pkgPath)) return true

      const pkg = loadJsonSync(pkgPath)

      return !semver.satisfies(semver.clean(pkg.version), versionSpec)
    })

    if (missingDeps.length) {
      const depArgs = missingDeps.map(
        ([depName, semver]) => `${depName}@${semver}`
      )
      this.emit(
        "info",
        `installing missing deps in ${targetPath}\n${depArgs.join(" ")}`
      )
      await exec(
        "npm",
        [
          "install",
          "--prefer-offline",
          "--no-progress",
          // "--no-save",
          ...depArgs
        ],
        {
          cwd: targetPath,
          quiet: this.options.quiet
        }
      )
    }
  }

  async _installMissingDepsOnBuildDir(pkg) {
    const deps = Object.entries({
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    })

    return this._installMissingDeps(deps, this.buildPath)
  }

  /**
   * Even though the project dir won't have build dirs installs it could conceivably use them anyhow (like with jest).
   * Installing their @types/* specs makes development better, especially in vscode.
   */
  async _installTypePackagesToProject() {
    const buildPkg = await loadJson(
      path.resolve(this.buildPath, "package.json")
    )
    const typeDefs = Object.entries(buildPkg.devDependencies || {}).filter(
      ([name]) => name.match(/^@types\//)
    )

    return this._installMissingDeps(typeDefs, this.projectDir)
  }

  async _patchBuildWithProject() {
    this.emit("info", "patching build with project")
    const ignoredRegex = /^(node_modules|package.json|package-lock.json|[.].*)$/
    const sourcePaths = (await fs.readdir(this.projectDir)).filter(
      p => !p.match(ignoredRegex)
    )
    for (const p of sourcePaths) {
      const srcPath = path.resolve(this.projectDir, p)
      const targetPath = path.resolve(this.buildPath, p)
      this.emit("info", `patching ${p}`)
      if (fs.pathExists(targetPath)) {
        await fs.remove(targetPath)
      }
      await fs.copy(srcPath, targetPath)
    }
  }
}
