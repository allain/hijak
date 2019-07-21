import HijakProject from "./HijakProject"
import _main from "./main"

export default HijakProject

export const main = _main
if (module.parent === null) {
  _main().catch(err => {
    console.error(err)
  })
}
