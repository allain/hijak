# hijak

An tool for hijacking another project's npm scripts for the greater good.

## But Why?

Because these things make me sad:

- Maintaining a build pipeline for each project really sucks.
- Most code boilerplates (except for the big boys) are decoupled from the project from which they are based the moment you start changing them.
- Build systems will inevitably be replaced. When it happens it shouldn't grind everything to a halt.
- Security vulnerabilities in the build pipeline (within jest for example) are taking up an increasing amount of my time. Every single project I wrote using jest needs to be updated. I'm ready to flip a table over this.

## The Hijak Approach

Your code is a patch on a hijacked project.
It performs the patch, then starts a synchronizer and watches the scripts run, duplicating changes in your project.

A nice little flowchart of what happens when you run **`hijak run build`**: https://code2flow.com/XrT0F2

## Hijak in 5 minutes (or less)

Step 1 - install hijak

```bash
npm install --global hijak
```

Step 2 - write a simple project (or clone one like we do below)

The one below uses, jest and import both a prod and dev dependency.

```bash
git clone git@github.com:allain/example-hijak-js.git example
cd example
```

Step 3 - Perform the hijack

In this case the hijacked template offers esm module support, tree shaking of generated bundles, and jest out of the box.

```
hijak git@github.com:allain/template-npm-project.git
```

Step 4 - Profit

All of the hijacked npm run scripts are now available to you through the `hijak` tool.

In this case

```bash
# to get a list of available npm run scripts
hijak run

# to run tests in watch mode and generate code coverage reports
hijak test -- --watchAll --coverage

# to run build in watch mode
hijak run build -- --watch

# to clean your project of any generate build artifacts
hijak run clean
```
