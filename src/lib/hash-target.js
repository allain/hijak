export default function hashTarget(str) {
  const hash = str
    .split("")
    .reduce((hash, c, index) => ((hash + c.charCodeAt(0)) << 5) | 0, 0)

  return Math.abs(hash)
}
