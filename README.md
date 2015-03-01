# gc-cli
[![Build Status](https://secure.travis-ci.org/briandipalma/gc-cli.png)](http://travis-ci.org/briandipalma/gc-cli)
[![Dependency Status](https://david-dm.org/briandipalma/gc-cli.png?theme=shields.io)](https://david-dm.org/briandipalma/gc-cli)

# Testing

Run tests

```bash
$ npm t
```

### Command line flags

* `--namespaces` or `-n` a comma separated list of root namespaces to convert to CJS.

```bash
$ gc-cli --namespaces myroot,otherroot,someroot
```

* `--compileTestFiles` or `-t` convert `tests`, use a transform pipeline configured for tests.

```bash
$ gc-cli --compileTestFiles
```
