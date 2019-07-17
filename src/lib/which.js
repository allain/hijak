import { promisify } from "util"
import _which from "which"
export default promisify(_which)
