var JsMockito = require("jsmockito");
var defineTestCase = require("jstestdriverextensions").defineTestCase;
var Errors = require('br/Errors');
var Errors = require('br/Errors').namedExport;
require('jsmockito').registerService('caplin.user-prompt-service', prompter);
require('jsmockito')('caplin.user-prompt-service', prompter);
