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

A nice little flowchart of what happens when you run **`hijak run build`**: https://code2flow.com/s9xsQA

## Hijak in 5 minutes (or less)

Step 1 - install hijak

```bash
npm install --global hijak
```

Step 2 - start with a simple project

We've created a simple one that supports esm modules and jest for testing. It's not much, but it demonstrates things well.

```bash
git clone git@github.com:allain/example-hijak-js.git example
cd example
```

Step 3 - Perform the hijack

```
hijak git@github.com:allain/template-npm-project.git
```

Step 4 - Profit

The hijacked
All of the hijacked npm run scripts are now available to you through the `hijak` tool.

```bash
hijak test -- --watchAll
hijak run build -- --watch
hijak run clean
```
