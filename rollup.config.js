import resolve from "rollup-plugin-node-resolve"

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs"
      // exports: "named"
    },
    {
      file: "dist/index.esm.js",
      format: "esm"
      // exports: "named"
    }
  ]
  // plugins: [resolve()]
}
