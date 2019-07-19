import path from "path"
import HijakProject from "../src/HijakProject"
import withTestProject from "./fixtures/with-test-project"

describe("HijakProject", () => {
  it("can be created", () => {
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

  it.only("supports install/uninstall", () =>
    withTestProject(async projectDir => {
      const hp = new HijakProject(projectDir)
      expect(hp.installed).toBe(false)
      await hp.install("git@github.com:allain/template-test.git")
      expect(hp.installed).toEqual(true)
      await hp.uninstall()
      expect(hp.installed).toEqual(false)
    }))
})
