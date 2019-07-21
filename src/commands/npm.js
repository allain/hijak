export default function npmCommand(hijakProject, args, argv) {
  return hijakProject.npm(argv.slice(2))
}
