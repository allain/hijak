import fs from "fs-extra"

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
