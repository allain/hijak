import exec from "../../src/lib/exec"

describe("exec", () => {
  it("resolves on success", async () =>
    expect(exec("echo", ["0"])).resolves.toEqual(0))

  it("rejects on error", () =>
    expect(exec("missing-command", [""])).rejects.toMatchObject({
      message: "spawn missing-command ENOENT",
      code: "ENOENT"
    }))
})
