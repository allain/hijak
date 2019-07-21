import Debug from "debug"

const debug = Debug("hijak")

export default function npmCommand(hijakProject, args, argv) {
  debug("received raw args %o", argv)
  // I'm not sure what the right way ot handle -- is, but this feels right
  const preparedArgs = argv.slice(2)
  if (!preparedArgs.some(a => a === "--")) {
    if (preparedArgs[0] === "run") {
      // it's a command
      if (preparedArgs[1] && preparedArgs[1][0] !== "-") {
        preparedArgs.splice(2, 0, "--")
      } else {
        preparedArgs.splice(1, 0, "--")
      }
    } else if (preparedArgs[0] === "start") {
      preparedArgs.splice(1, 0, "--")
    } else if (preparedArgs[0] == "test") {
      preparedArgs.splice(1, 0, "--")
    }
  }
  return hijakProject.npm(preparedArgs)
}
