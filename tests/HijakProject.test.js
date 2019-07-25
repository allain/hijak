import fs from "fs-extra"
import os from "os"
import path from "path"
import { loadText } from "../src/lib/load-file"
import HijakProject from "../src/HijakProject"
import withTestProject from "./fixtures/with-test-project"
import exec from "../src/lib/exec"
import sleep from "../src/lib/sleep"
import which from "which"

const TEST_GIT_URL = "git@github.com:allain/template-test.git"
const TEST_GIT_DIR = path.resolve(__dirname, "fixtures", "template-test")

describe("HijakProject", () => {
  // because part of the setup is to clone from github

  beforeAll(async () => {
    await exec("git", ["submodule", "init"])
    await exec("git", ["submodule", "update"])
  })

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

  it("can be created", () => {
    const built = new HijakProject(os.tmpdir(), { quiet: true })
    expect(new HijakProject(os.tmpdir())).toBeInstanceOf(HijakProject)
  })

  it("exposes installed prop", () =>
    withTestProject(projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      expect(hp.installed).toBe(false)
    }))

  it("exposes buildPath", () =>
    withTestProject(projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      expect(hp.buildPath).toMatch(/.*[\/\\][.]hijak[\/\\]project-.*/)
    }))

  it("supports install/uninstall of git directories", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      expect(hp.installed).toBe(false)
      await hp.hijack(TEST_GIT_DIR)
      expect(hp.installed).toEqual(true)
      await hp.free()
      expect(hp.installed).toEqual(false)
    }))

  it(
    "supports install/uninstall of gitURLs",
    () =>
      withTestProject(async projectDir => {
        const hp = new HijakProject(projectDir, { quiet: true })
        expect(hp.installed).toBe(false)
        await hp.hijack(TEST_GIT_URL)
        expect(hp.installed).toEqual(true)
        await hp.free()
        expect(hp.installed).toEqual(false)
      }),
    60000
  )

  it("supports running scripts", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      return expect(hp.npm(["run", "success"])).resolves.toBeUndefined()
    }))

  it("passes args through to underlying npm", () =>
    withTestProject(async projectDir => {
      const hijakPath = await new Promise((resolve, reject) =>
        which("hijak", (err, p) => (err ? reject(null) : resolve(p)))
      )
      if (!hijakPath) {
        console.log("SKIPPING use of global hijak")
        return
      }
      const testPath = path.join(os.tmpdir(), "ARGS")

      if (await fs.pathExists(testPath)) {
        await fs.remove(testPath)
      }

      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      await exec("npm", ["run", "delegate-args", "--", "YO"], {
        cwd: projectDir
      })

      expect((await loadText(testPath)).trim()).toEqual("YO")

      await exec("npm", ["run", "delegate-args", "HELLO"], {
        cwd: projectDir
      })

      expect((await loadText(testPath)).trim()).toEqual("HELLO")
    }))

  it("running hijak run yields the expected npm run result", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      return expect(hp.npm(["run"])).resolves.toBeUndefined()
    }))

  it.only("failing scripts reject to exit code", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      await expect(hp.npm(["run", "fail"])).rejects.toBe(1)
      await expect(hp.npm(["run", "fail-code", "2"])).rejects.toBe(2)
    }))

  it("is lazy when setting up buildDir dependencies", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      await hp.npm(["run", "success"])
      const statFirst = fs.stat(
        path.resolve(hp.buildPath, "node_modules", "lodash.tolower")
      )
      await sleep(100)
      // This should not re-install lodash.tolower again
      await hp.npm(["run", "success"])
      const statSecond = fs.stat(
        path.resolve(hp.buildPath, "node_modules", "lodash.tolower")
      )
      expect(statFirst).toEqual(statSecond)
    }))

  it("copies files from projectDir to buildDir", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      await hp.hijack(TEST_GIT_DIR)

      await hp.npm(["run", "cat-file-to-tmp"])

      await expect(await loadText(path.join(os.tmpdir(), "FILE"))).toEqual("REPLACED")
    }))

  it("installs any @types/* dependencies from the buildDir into the projectDir", async () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir, { quiet: true })
      const typePath = path.resolve(
        projectDir,
        "node_modules",
        "@types",
        "jest"
      )

      if (await fs.pathExists(typePath)) await fs.remove(typePath)
      expect(await fs.pathExists(typePath)).toBe(false)

      await hp.hijack(TEST_GIT_DIR)

      await hp.npm(["run", "success"])

      expect(await fs.pathExists(typePath)).toBe(true)
    }))
})
