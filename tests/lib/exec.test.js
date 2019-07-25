import exec from "../../src/lib/exec"
import path from 'path'

describe("exec", () => {
  it("resolves on success", async () =>
    expect(exec("node", [path.resolve(__dirname, "..", "fixtures", "echo.js"), "0"])).resolves.toEqual(0))

  it.skip("rejects on error", () => {
    const result = exec("missing-command", [])
    return expect(result).rejects.toThrow()
  })
})
