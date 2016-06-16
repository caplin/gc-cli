# gc-cli
[![Build Status](https://secure.travis-ci.org/caplin/gc-cli.png)](http://travis-ci.org/caplin/gc-cli)
[![Dependency Status](https://david-dm.org/caplin/gc-cli.png?theme=shields.io)](https://david-dm.org/caplin/gc-cli)

### Purpose

Converts namespaced JavaScript code to CommonJS modules.

This:

```javascript
caplin.grid.GridView = function() {
	this._scrollView = new caplin.grid.ScrollPane();
}
```

will be converted to:

```javascript
'use strict';

var ScrollPane = require('caplin/grid/ScrollPane');

function GridView() {
	this._scrollView = new ScrollPane();
}

module.exports = GridView;
```

Also formats code using the [js-formatter](https://github.com/briandipalma/js-formatter) tool and adds requires for
**specified** globals i.e. `jQuery.on(...)` will add `var jQuery = require('jQuery')` if they are present in the
source code. To minimize changes you can format your code first and then run this tool.

### Requirements

node v6 or higher.

### Installation

Either install it globally:

```bash
$ npm i -g caplin/gc-cli
```

or clone this repository, `cd` into it and run

```bash
$ npm link
```

### Usage

Once installed `cd` into a directory with a `src` subdirectory (a blade, bladeset, lib or aspect) and run.

```bash
$ gc-cli
```

This will format all `*.js` files in the `src` directory.

### Suggested approach

Convert one blade, bladeset, lib, aspect `src` at a time, then run tests, verify the application is working and
perform smoke tests. `git checkout .` will revert the changes. Don't get bogged down on one conversion too long,
move to another one if the conversion is not straightforward. Do not work on converted code without commiting the
code locally or it will be difficult to keep track of your own changes versus the automated ones. The tests do not
need to be converted namespaced tests can still test converted CJS source code. Perform a code diff to verify the
conversion looks reasonable.

To convert JS patches `cd` into `js-patches` and run

```bash
$ gc-cli --outputDirectory=. "**/*.js"
```

#### Command line flags

You can modify the default options using these options:

* `--namespaces` or `-n` a comma separated list of namespace roots to convert to CJS.

```bash
$ gc-cli --namespaces caplin,caplinx,br,yournamespaceroot
```

* `--compileTestFiles` or `-t` convert `tests`, use a transform pipeline configured for tests.

```bash
$ gc-cli --compileTestFiles
```

### Contributing

Raise any issues, feature requests in this repository or create a PR for them.

#### Testing

Inside this repo

```bash
$ npm t
```
