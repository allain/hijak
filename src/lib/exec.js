import execa from "execa"
import Debug from "debug"

const debug = Debug("hijack:exec")

export default function exec(command, args, options = {}) {
  debug("running", command, ...args, options)
  const result = execa(command, args, options)
  result.stdout.pipe(process.stdout)
  result.stderr.pipe(process.stderr)
  return result
}
