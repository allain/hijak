import childProcess from 'child_process'
import Debug from 'debug'
import which from 'which'

const debug = Debug('hijak:exec')
/**
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} options
 * @returns {Promise}
 */
export default function exec (cmd, args, options = {}) {
  if (!cmd.match(/^[.\/]/)) {
    cmd = which.sync(cmd)
  }
  const { quiet, ..._options } = options

  return new Promise((resolve, reject) => {
    debug('running', cmd, ...args, options)

    const child = childProcess.spawn(cmd, args, { ..._options })
    child.on('error', err => {
      console.error(err.message)
      reject(1)
    })
    child.on('exit', code => {
      if (code) {
        reject(code)
      } else {
        resolve(code)
      }
      child.stdout.unpipe(process.stdout)
      child.stderr.unpipe(process.stderr)
      process.stdin.unpipe(child.stdin)
    })

    if (!quiet) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
      process.stdin.pipe(child.stdin)
    }
  })
}
