import path from "path"
import fs from "fs-extra"
import hashTarget from "./hash-target"

export function buildExpectedPath(target, projectDir = process.cwd()) {
  return path.join(projectDir, ".hijak", "target-" + hashTarget(target))
}
