# hijak

An experiment to hijack another project's npm scripts for the greater good.

## Usage

Step 1 - install hijak

```bash
# globally
npm install --global hijak

# or as a dependency of the sample project
npm install --save-dev hijak
```

Step 2 - create a simple project that will hijack another one

```bash
mkdir example
cd example/
npm init -y
```

Step 3 - Perform the hijack

```
hijak git@github.com:allain/template-npm-project.git
```

Step 4 - Profit

All of the hijacked npm run scripts are now available to you through the `hijak` tool.

```bash
hijak test -- --watchAll
hijak run build -- --watch
hijak run clean
```
