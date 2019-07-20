import path from "path"
import HijakProject from "../src/HijakProject"
import withTestProject from "./fixtures/with-test-project"

const TEST_GIT_URL = "git@github.com:allain/template-test.git"

describe("HijakProject", () => {
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

  it.skip("supports running scripts", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      await hp.install(TEST_GIT_URL)

      expect(await hp.run(["success"])).toEqual(0)
    }))
})
