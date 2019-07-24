import childProcess from "child_process"
import Debug from "debug"
import which from "./which"

const debug = Debug("hijak:exec")
/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {object} options
 * @returns {Promise}
 */
export default function exec(command, args, options = {}) {
  const { quiet, ..._options } = options

  return new Promise((resolve, reject) => {
    debug("running", command, ...args, options)

    let c = null
    if (quiet) {
      c = childProcess.spawn(command, args, { ..._options })
      process.stdin.pipe(c.stdin)
    } else {
      c = childProcess.spawn(command, args, { ..._options, stdio: "inherit" })
    }

    c.on("error", err => reject(err))
    c.on("exit", code => (code ? reject : resolve)(code))
  })
}
