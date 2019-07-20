import { main } from "../src/index"
import collect from "collect-console"

describe("main", () => {
  it("exports a function", () => {
    expect(main).toBeInstanceOf(Function)
  })

  it("displays usage message when run without args", async () => {
    const output = await collect.log(async () => {
      await main(process.argv.slice(0, 2))
    })

    expect(output).not.toHaveLength(0)

    expect(output.join("\n")).toMatch(/usage(.|\n)*<command>/gim)
  })

  it("displays usage message when run with --help and no command", async () => {
    const output = await collect.log(async () => {
      await main(process.argv.slice(0, 2).concat(["--help"]))
    })

    expect(output).not.toHaveLength(0)

    expect(output.join("\n")).toMatch(/usage/gi)
  })

  it("displays usage message when run with --help and install command", async () => {
    const output = await collect.log(async () => {
      await main(process.argv.slice(0, 2).concat(["install", "--help"]))
    })

    expect(output).not.toHaveLength(0)

    expect(output.join("\n")).toMatch(/--project/gi)
  })

  it("displays usage message when run with --help and run command", async () => {
    const output = await collect.log(async () => {
      await main(process.argv.slice(0, 2).concat(["run", "--help"]))
    })

    expect(output).not.toHaveLength(0)

    expect(output.join("\n")).toMatch(/--project/gi)
  })
})
