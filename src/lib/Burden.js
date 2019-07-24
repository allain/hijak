import fs from "fs-extra"
import Debug from "debug"
import sleep from "./sleep"
import { saveTextSync } from "./load-file"

const debug = Debug("hijak:lock")

const CHECK_INTERVAL = 500
const TIMEOUT_INTERVAL = 5000

/**
 * Locks the given file
 * @param {string} lockFilePath - path to file to lock
 */
export default class Burden {
  static bear(lockFilePath, onAcquire, onAcquireFirst) {
    return new Promise(resolve => {
      let lockPollId = null
      let onRelease = null

      async function tryAcquire(first = true) {
        if (fs.pathExistsSync(lockFilePath)) {
          if (
            Date.now() - fs.statSync(lockFilePath).mtime.getTime() <
            TIMEOUT_INTERVAL
          ) {
            resolve(release)

            return sleep(CHECK_INTERVAL).then(
              () => tryAcquire(false),
              // sleep can reject when process.on('SIGINT', is received), say, from CTRL+C
              () => false
            )
          } else {
            debug("acquiring burden because lock was too old")
            fs.removeSync(lockFilePath)
          }
        }

        try {
          if (first) {
            debug("first to aquire burden %s", lockFilePath)
            await onAcquireFirst()
          }
          debug("aquiring burden %s", lockFilePath)
          saveTextSync(lockFilePath, `${process.pid}`)
          lockPollId = setInterval(
            () => saveTextSync(lockFilePath, `${process.pid}`),
            CHECK_INTERVAL
          )
          onRelease = await onAcquire()
          process.on("SIGINT", () => onRelease())
          resolve(release)
        } catch (err) {
          fs.removeSync(lockFilePath)
          clearInterval(lockPollId)
          lockPollId = null
        }
      }

      tryAcquire()

      async function release() {
        if (onRelease) {
          debug("releasing burden %s", lockFilePath)
          await onRelease()
          clearInterval(lockPollId)
          fs.removeSync(lockFilePath)
          clearInterval(lockPollId)
          lockPollId = null
        }
      }
    })
  }
}
