# grunt-flowbin

This is a thin [grunt](http://gruntjs.com/) wrapper around the
[flow-bin](https://github.com/flowtype/flow-bin/) command line tool.

It allows you to integrate [Flow](http://flowtype.org/)'s
static JavaScript analysis into your Grunt toolchain.
Unlike other solutions, this one attempts to pass off as much work
to `flow-bin` as possible and get out of your way.

## Installation

    npm install --save-dev grunt-flowbin

## Configuration

Add a target to your grunt configuration for each `flow` command you'd
like to run. If you wanted to run `flow check` as `grunt flowbin:check`
you'd add this:

````javascript
grunt.initConfig({
  flowbin: {
    check: {},
  },
});
````

## flow options

If you're too solarized and need to run `flow check --color=never`
as `grunt flowbin:check` then you can add target options for it like:

````javascript
grunt.initConfig({
  flowbin: {
    check: {
      color: 'never',
    },
  },
});
````

If you want to pass a flag (an option without a value) like `flow check --quiet`,
give the option a value of `null`:

````javascript
grunt.initConfig({
  flowbin: {
    check: {
      quiet: null,
    },
  },
});
````

If you want to see the way `flow check` is invoked (the default options, etc),
run `grunt --verbose ...`.

## Supported flow commands

Here are the Grunt targets you can define for all the `flow` commands currently
supported. If you define a target that's not supported, the Grunt task will
attempt to run it just like `flow yourtarget` but that may or may not work.

````javascript
grunt.initConfig({
  flowbin: {
    check: {},
    start: {},
    stop: {},
    status: {},
  },
});
````

Run `flow --help` for info on what these commands do.

## Continuous flow checks

Since `grunt flowbin:check` checks all files (which can be slow), you
will probably want to use
[grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch)
to only check files as they change in your source tree.
`flow-bin` provides support for this with a standalone server that
caches a bunch of things.

Here's an example of how to start a server, watch for file changes, and
check files as they change:

````javascript
grunt.initConfig({
  // Configure your `grunt flowbin` task:
  flowbin: {
    // Define targets for the flow commands you need.
    start: {},
    status: {},
  },
  // Configure your `grunt watch:develop` task:
  watch: {
    develop: {
      files: [
        // Watch all your source files. Your path may be different.
        'src/**/*.js',
      ],
      tasks: [
        // Run your custom test command (assuming it exists as such):
        'test',
        // Ask the flow server for status on recently changed files:
        'flowbin:status',
      ],
    },
  },
});

// Register a custom command that starts a flow server then watches
// for file changes:
grunt.registerTask('develop', [
  'flowbin:start',
  'watch:develop',
]);
````

With this configuration, you can start a custom task as `grunt develop`
that calls `flowbin:start` to start the server then `watch:develop` to
watch for file changes. When a file changes, this configuration calls
your custom `test` command and then `flowbin:status` to only check the
status on newer files.

## Contributing

Grab a clone and get started like this:

    npm install
    npm test
