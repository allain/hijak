import { loadJson, loadJsonSync, saveJson } from "./lib/load-file"
import Debug from "debug"
import fs from "fs-extra"
import path from "path"

const debug = Debug("hijak:install")

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
}
