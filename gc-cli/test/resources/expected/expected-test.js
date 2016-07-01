(function() {
    var i18n = require("br/I18n");
    var sinon = require("sinonjs");
    var jQuery = require("jquery");
    my.lib("sinonjs");

    var ERROR_MESSAGE = {
		type: "info",
		styleType: "error",
		message: i18n("my.token")
	};

    var testCase = {
		setUp: function() {
			createStubs();
			jQuery(someElement);
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
