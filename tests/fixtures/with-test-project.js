import fs from "fs-extra"
import os from "os"
import path from "path"

import { saveJson, saveText } from "../../src/lib/load-file"

const randomInt = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

export default async function withTestProject(fn) {
  const randomPath = path.join(os.tmpdir(), `hijak-test-${randomInt()}`)
  await fs.ensureDir(randomPath)

  await saveJson(path.join(randomPath, "package.json"), {
    name,
    version: "0.1.0",
    dependencies: {
      "lodash.tolower": "^4.1.2"
    }
  })

  await saveText(path.join(randomPath, "FILE"), "REPLACED")

  await saveText(
    path.join(randomPath, "src", "index.js"),
    `
    const toLower = require('lodash.tolower')

    module.exports = function lower(name) {
      return toLower(name)
    }
  `
  )

  await saveText(
    path.join(randomPath, "tests", "yippee.test.js"),
    `
    const lower = require('../src/index.js')
   describe('testing', () => {
     it("can use deps from target", () => {
       expect(lower('BOB')).toEqual('bob')
     })
   }) 
  `
  )

  return Promise.resolve().then(() => fn(randomPath))
}
