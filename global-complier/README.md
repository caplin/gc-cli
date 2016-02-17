# Global compiler

[![Build Status](https://secure.travis-ci.org/briandipalma/global-compiler.png)](http://travis-ci.org/briandipalma/global-compiler)
[![Dependency Status](https://david-dm.org/briandipalma/global-compiler.png?theme=shields.io)](https://david-dm.org/briandipalma/global-compiler)

### Purpose

This repository hosts a set of JS code transforms. The purpose of the transforms is to take script JS code and
transform it into CommonJS module code. The transforms are designed to be used by other tools.

### Mechanics

The transforms are [recast AST visitors](https://github.com/benjamn/recast). The transformations are independent of
each other but can be composed to produce complex transformations. The transforms are configured by their user. The
[gc-cli repo](https://github.com/briandipalma/gc-cli) has examples of how to utilize, combine and configure the
transforms.

### Testing

Run tests

```bash
$ npm t
```
