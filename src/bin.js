import path from "path"

import program from "commander"
import hijack from "./commands/hijack"
import run from "./commands/run"
import { loadJsonSync } from "./lib/load-file"

const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))

program.version(pkg.version).parse(process.argv)

hijack(program)
run(program)

program.parse(process.argv)
