import { loadJson, loadJsonSync, saveJson } from "./lib/load-file"
import Debug from "debug"
import fs from "fs-extra"
import path from "path"
import which from "../src/lib/which"
import exec from "../src/lib/exec"
import sleep from "../src/lib/sleep"
import syncDirs from "../src/lib/sync-dirs"

const debug = Debug("hijak")

export default class HijakProject {
  constructor(projectDir) {
    this.projectDir = projectDir
  }

  get installed() {
    return !!loadJsonSync(path.join(this.projectDir, "package.json")).hijak
  }

  get buildPath() {
    return path.join(this.projectDir, "node_modules", ".hijak")
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

  async install(gitUrl) {
    debug("adding hijack config into package.json")
    await this._updatePkg(pkg => ({ ...pkg, hijak: { repo: gitUrl } }))

    if (fs.pathExists(this.buildPath)) {
      debug("removing %s", this.buildPath)
      await fs.remove(this.buildPath)
    }
  }

  async uninstall() {
    if (fs.pathExists(this.buildPath)) {
      debug("removing %s", this.buildPath)
      await fs.remove(this.buildPath)
    }

    await this._updatePkg(pkg => {
      delete pkg.hijak
    })
  }

  async run(npmArgs) {
    if (!this.installed) {
      throw new Error("hijak not found")
    }
    const npmPath = await which("npm")

    const pkg = await this._loadProjectPackage()

    const gitUrl = pkg.hijak.repo

    await fs.ensureDir(path.resolve(this.projectDir, "node_modules"))

    if (await fs.pathExists(this.buildPath)) {
      await this._resetBuildDir()
    } else {
      await this._createBuildDir(gitUrl)
    }

    await this._patchBuildWithProject()

    await this._installTypePackagesToProject()

    await this._installProjectDepsOnBuildDir(pkg)

    const stopSync = syncDirs(process.cwd(), this.buildPath)
    return exec(npmPath, ["run", ...npmArgs], {
      cwd: this.buildPath
    }).then(
      async () => {
        debug("waiting for last changes to sync")
        await sleep(100) // Seems chokidar shutdown isn't immediate
        await stopSync()
        return true
      },
      async err => {
        debug("waiting for last changes to sync")
        await stopSync()
        return false
      }
    )
  }

  async _createBuildDir(gitUrl) {
    const gitBin = await which("git")
    await exec(gitBin, ["clone", "--quiet", gitUrl, this.buildPath], {
      cwd: this.projectDir
    })
  }

  async _resetBuildDir() {
    const gitBin = await which("git")
    await exec(gitBin, ["reset", "--hard", "--quiet"], {
      cwd: this.buildPath
    })
    await exec(gitBin, ["clean", "-f", "--quiet"], { cwd: this.buildPath })
  }

  async _installProjectDepsOnBuildDir(pkg) {
    const missingBuildDeps = Object.entries({
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    }).filter(([depName, semver]) => {
      try {
        require.resolve(depName, { paths: [this.buildPath] })
        return false
      } catch (err) {
        return true
      }
    })

    if (missingBuildDeps.length) {
      const depArgs = missingBuildDeps.map(
        ([depName, semver]) => `${depName}@${semver}`
      )
      await exec("npm", ["install", "--silent", "--no-save", ...depArgs], {
        cwd: this.buildPath
      })
    }
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
    const missingTypeDefs = typeDefs.filter(([depName]) => {
      return !fs.pathExistsSync(
        path.join(this.projectDir, "node_modules", depName)
      )
    })
    if (missingTypeDefs.length) {
      const depArgs = missingTypeDefs.map(
        ([depName, semver]) => `${depName}@${semver}`
      )
      await exec("npm", ["install", "--silent", "--no-save", ...depArgs], {
        cwd: this.projectDir
      })
    }
  }

  async _patchBuildWithProject() {
    const ignoredRegex = /^(node_modules|package.json|package-lock.json|[.].*)$/
    const sourcePaths = (await fs.readdir(this.projectDir)).filter(
      p => !p.match(ignoredRegex)
    )
    for (const p of sourcePaths) {
      const srcPath = path.resolve(this.projectDir, p)
      const targetPath = path.resolve(this.buildPath, p)
      debug(`copying %s to %s`, p, targetPath)
      if (fs.pathExists(targetPath)) {
        await fs.remove(targetPath)
      }
      await fs.copy(srcPath, targetPath)
    }
  }
}