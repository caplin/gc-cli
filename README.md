# gc-cli
[![Build Status](https://secure.travis-ci.org/caplin/gc-cli.png)](http://travis-ci.org/caplin/gc-cli)
[![Dependency Status](https://david-dm.org/caplin/gc-cli.png?theme=shields.io)](https://david-dm.org/caplin/gc-cli)

### Purpose

This repository hosts a command line tool that converts package/folder namespaced JavaScript code
to CommonJS modules. So scripts with classes defined in a namespaced manner will be flattened and
references to namespaced dependencies will be replaced with bindings to required modules.

Code in this style:

```javascript
caplin.grid.GridView = function() {
	this._scrollView = new caplin.grid.ScrollPane();
}
```

will be converted to code in this style:

```javascript
'use strict';

var ScrollPane = require('caplin/grid/ScrollPane');

function GridView() {
	this._scrollView = new ScrollPane();
}
```

It also formats the code using the [js-formatter](https://github.com/briandipalma/js-formatter)
tool and adds requires for specified globals i.e. `jQuery.on(...)` will add
`var jQuery = require('jQuery')` if they are present in the source code. To minimize changes you
can format your code first and then run this tool.

### Mechanics

This package makes use of the global-compiler package for source code transformations and the [js-formatter](https://github.com/briandipalma/js-formatter) tool for code formatting.

To use as a command line tool install it globally with the command.

```bash
$ npm i -g caplin/gc-cli
```

Once installed `cd` into a directory with a `src` subdirectory and run.

```bash
$ gc-cli
```

This will format all `*.js` files in the `src` directory using the default options.

```bash
$ gc-cli -t
```

Will format the `tests` directory.

To convert JS patches cd into `js-patches` and run

```bash
$ gc-cli --outputDirectory=. "**/*.js"
```

#### Command line flags

You can modify the default options using these options

* `--namespaces` or `-n` a comma separated list of root namespaces to convert to CJS.

```bash
$ gc-cli --namespaces caplin,caplinx,otherroot,someroot
```

* `--compileTestFiles` or `-t` convert `tests`, use a transform pipeline configured for tests.

```bash
$ gc-cli --compileTestFiles
```

### Testing

Inside this repo

```bash
$ npm t
```
