import execa from "execa"
import Debug from "debug"

const debug = Debug("hijak:exec")
/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {object} options
 * @returns {import('execa').ExecaChildProcess}
 */
export default function exec(command, args, options = {}) {
  debug("running", command, ...args, options)
  const result = execa(command, args, options)
  result.stdout.pipe(process.stdout)
  result.stderr.pipe(process.stderr)
  return result
}
