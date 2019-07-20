// This file is here so that jest tests can be written in using esm modules.
module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  modulePathIgnorePatterns: ["dist/"]
}
