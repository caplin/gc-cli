#!/usr/bin/env node
"use strict";

var gcCli = require("../");

gcCli.processFile(process.argv.slice(2));
