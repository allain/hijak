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
  constructor(lockFilePath, onAcquire, onAcquireFirst = null) {
    this._lockFilePath = lockFilePath
    this._onAcquire = onAcquire
    this._onAcquireFirst = onAcquireFirst
    this._lockPollId = null
    this._onRelease = null

    this._tryAcquire()
  }

  async _tryAcquire(first = true) {
    if (fs.pathExistsSync(this._lockFilePath)) {
      if (
        Date.now() - fs.statSync(this._lockFilePath).mtime.getTime() <
        TIMEOUT_INTERVAL
      ) {
        return sleep(CHECK_INTERVAL).then(
          () => this._tryAcquire(false),
          // sleep can reject when process.on('SIGINT', is received), say, from CTRL+C
          () => false
        )
      } else {
        debug("acquiring burden because lock was too old")
        fs.removeSync(this._lockFilePath)
      }
    }

    try {
      if (first) {
        debug("first to aquire burden %s", this._lockFilePath)
        await this._onAcquireFirst()
      }
      debug("aquiring burden %s", this._lockFilePath)
      saveTextSync(this._lockFilePath, `${process.pid}`)
      this._lockPollId = setInterval(
        () => saveTextSync(this._lockFilePath, `${process.pid}`),
        CHECK_INTERVAL
      )
      this._onRelease = await this._onAcquire()
      process.on("SIGINT", () => this.release())
    } catch (err) {
      fs.removeSync(this._lockFilePath)
      clearInterval(this._lockPollId)
      this._lockPollId = null
    }
  }

  async release() {
    if (this._onRelease) {
      debug("releasing burden %s", this._lockFilePath)
      await this._onRelease()
      clearInterval(this._lockPollId)
      fs.removeSync(this._lockFilePath)
      clearInterval(this._lockPollId)
      this._lockPollId = null
    }
  }
}
