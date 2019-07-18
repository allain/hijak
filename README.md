# hijack

An attempt to hijack another project's npm scripts for the greater good.

## Usage

Step 1 - install hijack

```bash
# globally
npm install --global hijack

# or as a dependency of the sample project
npm install --save-dev hijack
```

Step 2 - create a simple project that will hijack another one

```bash
mkdir example
cd example/
npm init -y
```

Step 3 - Perform the hijack

```
hj git@github.com:allain/template-npm-project.git
```

Step 4 - Profit

All of the hijacked npm run scripts are now available to you through the `hj` tool.

For example, with the template given above, the command below will run jest on the project created above.

```bash
hj test -- --watchAll
```
