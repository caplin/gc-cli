# Global compiler [![Build Status](https://secure.travis-ci.org/briandipalma/global-compiler.png)](http://travis-ci.org/briandipalma/global-compiler) [![Dependency Status](https://david-dm.org/briandipalma/global-compiler.png?theme=shields.io)](https://david-dm.org/briandipalma/global-compiler)

This repositry hosts a set of JS source code transformers.
The transformers are [recast AST visitors](https://github.com/benjamn/recast).
The transformations are independent of each other but can be combined together to produce complex transformations.

The transforms contain no hardcoded values but are instead configured by external users.
The [gc-cli repo](https://github.com/briandipalma/gc-cli) has examples of how to utilize, combine and configure the transforms.

# Testing

Run tests

```bash
$ npm t
```
