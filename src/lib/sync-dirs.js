import syncGlob from "sync-glob"

export default function syncDirectory(srcPath, targetPath) {
  return syncGlob(srcPath + "/**", targetPath)
}
