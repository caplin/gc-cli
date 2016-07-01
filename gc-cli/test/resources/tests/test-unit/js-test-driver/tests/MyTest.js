caplin.thirdparty('jquery');
my.lib("sinonjs");

(function() {
	var ERROR_MESSAGE = {
		type: "info",
		styleType: "error",
		message: ct.i18n("my.token")
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
}());
