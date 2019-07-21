import fs from "fs-extra"
import path from "path"

export async function loadJson(filePath) {
  const content = await fs.readFile(filePath, "utf-8")
  return JSON.parse(content)
}

export function loadJsonSync(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(content)
}

export async function saveJson(filePath, obj) {
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2))
}

export async function loadText(filePath) {
  return await fs.readFile(filePath, "utf-8")
}

export function loadTextSync(filePath) {
  return fs.readFileSync(filePath, "utf-8")
}

export async function saveText(filePath, content) {
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content)
}
