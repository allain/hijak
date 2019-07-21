import Debug from "debug"

const debug = Debug("hijak")

export default function npmCommand(hijakProject, args, argv) {
  debug("received raw args %o", argv)
  // I'm not sure what the right way ot handle -- is, but this feels right
  const rawArgs = argv.slice(2)
  if (!rawArgs.some(a => a === "--")) {
    if (rawArgs[0] === "run") {
      // it's a command
      if (rawArgs[1] && rawArgs[1][0] !== "-") {
        rawArgs.splice(2, 0, "--")
      } else {
        rawArgs.splice(1, 0, "--")
      }
    } else if (rawArgs[0] === "start") {
      rawArgs.splice(1, 0, "--")
    } else if (rawArgs[0] == "test") {
      rawArgs.splice(1, 0, "--")
    } else if (rawArgs[0] === "run") {
      rawArgs.splice(2, 0, "--")
    }
  }
  return hijakProject.npm(argv.slice(2))
}
