import HijakProject from "./HijakProject"
import main from "./main"

export default HijakProject

if (module.parent === null) {
  main().catch(err => {
    console.error(err)
  })
}
