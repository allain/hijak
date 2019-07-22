import _which from "which"

export default function which(cmd) {
  return _which.sync(cmd)
}
