import _which from "which"

export default function which(bin) {
  return new Promise((resolve, reject) =>
    _which(bin, (err, binPath) => (err ? reject(err) : resolve(binPath)))
  )
}
