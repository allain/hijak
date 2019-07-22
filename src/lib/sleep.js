export default function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
      process.off("SIGINT", reject)
    }, ms)
    process.once("SIGINT", reject)
  })
}
