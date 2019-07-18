const os = require("os")
const path = require("path")
const fs = require("fs-extra")
const { loadJson, saveJson } = require("../src/lib/load-file")
const { buildExpectedPath } = require("../src/lib/target-utils")

const hijack = require("../src/commands/hijack")
const run = require("../src/commands/run")

const randomInt = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

async function buildTestProject(name) {
  const randomPath = path.join(
    os.tmpdir(),
    `hijack-test-${name}-${randomInt()}`
  )
  await fs.ensureDir(randomPath)

  await saveJson(path.join(randomPath, "package.json"), {
    name,
    version: "0.1.0"
  })

  return randomPath
}

describe("commands", () => {
  let testProject
  const TEMPLATE_URL = "git@github.com:allain/template-npm-project.git"

  // all of the tests will share the same one to speed things up
  beforeAll(async () => {
    const hijackTests = (await fs.readdir(os.tmpdir())).filter(ht =>
      ht.match(/hijack-test/)
    )
    await Promise.all(
      hijackTests.map(ht => fs.remove(path.join(os.tmpdir(), ht)))
    )

    testProject = await buildTestProject("test1")

    await hijack.action(TEMPLATE_URL, testProject)
  }, 30000)

  describe("hijack", () => {
    it("can be run on a simple npm project", async () => {
      const pkg = await loadJson(path.resolve(testProject, "package.json"))
      expect(pkg.hijack.repo).toEqual(TEMPLATE_URL)
    })

    it("clones the target as expected", async () => {
      expect(
        await fs.pathExists(buildExpectedPath(TEMPLATE_URL, testProject))
      ).toBe(true)
    })
  })

  describe.only("run", () => {
    it("can invoke scripts on hijacked project", async () => {
      const result = await run.action("test", testProject, {
        parent: { rawArgs: ["test"] }
      })

      console.log(result)
    })
  })
})
