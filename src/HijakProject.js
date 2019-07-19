import path from "path"

export default class HijakProject {
  constructor(projectDir) {
    this.projectDir = projectDir
  }

  get installed() {
    return false
  }

  get buildPath() {
    return path.join(this.projectDir, "node_modules", ".hijak")
  }

  async install(gitUrl) {}

  async uninstall() {}
}
