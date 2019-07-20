import fs from "fs-extra"
import path from "path"
import { loadText } from "../src/lib/load-file"
import HijakProject from "../src/HijakProject"
import withTestProject from "./fixtures/with-test-project"
import sleep from "../src/lib/sleep"

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
      expect(hp.buildPath).toMatch(/.*\/[.]hijak\/project-.*/)
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

      return expect(hp.run(["success"])).resolves.toBe(true)
    }))

  it.todo("failing scripts return the exit code of the failure")

  it("failing scripts return false", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      return expect(hp.run(["fail"])).resolves.toBe(false)
    }))

  it("is lazy when setting up buildDir dependencies", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      await hp.run(["success"])
      const statFirst = fs.stat(
        path.resolve(hp.buildPath, "node_modules", "lodash.tolower")
      )
      await sleep(100)
      // This should not re-install lodash.tolower again
      await hp.run(["success"])
      const statSecond = fs.stat(
        path.resolve(hp.buildPath, "node_modules", "lodash.tolower")
      )
      expect(statFirst).toEqual(statSecond)
    }))

  it("copies files from projectDir to buildDir", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      await hp.run(["cat-file-to-tmp"])

      await expect(await loadText("/tmp/FILE")).toEqual("REPLACED")
    }))

  it("installs any @types/* dependencies from the buildDir into the projectDir", async () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      const typePath = path.resolve(
        projectDir,
        "node_modules",
        "@types",
        "jest"
      )

      if (await fs.pathExists(typePath)) await fs.remove(typePath)
      expect(await fs.pathExists(typePath)).toBe(false)

      await hp.install(TEST_GIT_URL)

      await hp.run(["success"])

      expect(await fs.pathExists(typePath)).toBe(true)
    }))
})
