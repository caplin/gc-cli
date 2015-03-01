(function() {
    var sinon = require("sinonjs");
    var i18n = require("br/I18n");
    my.lib("sinonjs");

    var ERROR_MESSAGE = {
		type: "info",
		styleType: "error",
		message: i18n("my.token")
	};

    var testCase = {
		setUp: function() {
			createStubs();
		},

		tearDown: function() {
			removeStubs();
		},

		"test that test": function() {
			assertTrue(true);
		},

		"test that testTest": function() {
			assertTrue(true);
		}

	};

    TestCase("MyTest", sinon.testCase(testCase));
})();
