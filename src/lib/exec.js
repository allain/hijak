import execa from "execa"
import Debug from "debug"

const debug = Debug("hijak:exec")
/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {object} options
 */
export default async function exec(command, args, options = {}) {
  debug("running", command, ...args, options)
  const result = execa(command, args, options)
  result.stdout.pipe(process.stdout)
  result.stderr.pipe(process.stderr)
  await result
  return result
}
