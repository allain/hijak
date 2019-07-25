import childProcess from "child_process"
import Debug from "debug"
import which from "which"

const debug = Debug("hijak:exec")
/**
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} options
 * @returns {Promise}
 */
export default function exec(cmd, args, options = {}) {
  if (!cmd.match(/^[.\/]/)) {
    cmd = which.sync(cmd)
  }
  const { quiet, ..._options } = options

  return new Promise((resolve, reject) => {
    debug("running", cmd, ...args, options)

    let c = null
    if (quiet) {
      const result = childProcess.spawnSync(cmd, args, { ..._options })
      result.status ? reject(result.status) : resolve(result.status)
    } else {
      const result = childProcess.spawnSync(cmd, args, {
        ..._options,
        stdio: "inherit"
      })
      result.status ? reject(result.status) : resolve(result.status)
    }
  })
}
