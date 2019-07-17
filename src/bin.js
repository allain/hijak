import path from "path"

import program from "commander"
import hijack from "./commands/hijack"
import fallthrough from "./commands/fallthrough"
import { loadJsonSync } from "./lib/load-file"

const pkg = loadJsonSync(path.resolve(__dirname, "..", "package.json"))

program.version(pkg.version).parse(process.argv)

hijack(program)
fallthrough(program)

program.parse(process.argv)
