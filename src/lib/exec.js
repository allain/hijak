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

    const c = childProcess.spawn(command, args, { ..._options, shell: true })

    if (!quiet) {
      // Just passthrough output to calling process
      c.stdout.pipe(process.stdout)
      c.stderr.pipe(process.stderr)
    }
    process.stdin.pipe(c.stdin)

    c.on("error", err => reject(err))
    c.on("exit", code => (code ? reject : resolve)(code))
  })
}
