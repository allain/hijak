import path from "path"
import { loadText } from "../src/lib/load-file"
import HijakProject from "../src/HijakProject"
import withTestProject from "./fixtures/with-test-project"

const TEST_GIT_URL = "git@github.com:allain/template-test.git"

describe("HijakProject", () => {
  // because part of the setup is to clone from github
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

  it("can be created", () => {
    const built = new HijakProject("/tmp")
    expect(new HijakProject("/tmp")).toBeInstanceOf(HijakProject)
  })

  it("exposes installed prop", () =>
    withTestProject(projectDir => {
      const hp = new HijakProject(projectDir)
      expect(hp.installed).toBe(false)
    }))

  it("exposes buildPath", () =>
    withTestProject(projectDir => {
      const hp = new HijakProject(projectDir)
      expect(hp.buildPath).toEqual(
        path.join(projectDir, "node_modules", ".hijak")
      )
    }))

  it("supports install/uninstall", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      expect(hp.installed).toBe(false)
      await hp.install(TEST_GIT_URL)
      expect(hp.installed).toEqual(true)
      await hp.uninstall()
      expect(hp.installed).toEqual(false)
    }))

  it("supports running scripts", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      return expect(hp.run(["success"])).resolves.toBeUndefined()
    }))

  it("copies files from projectDir to buildDir", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      await hp.run(["cat-file-to-tmp"])

      await expect(await loadText("/tmp/FILE")).toEqual("REPLACED")
    }))
})
