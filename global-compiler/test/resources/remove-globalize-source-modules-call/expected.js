(function() {
    caplin.thirdparty('jstestdriverextensions');
    caplin.thirdparty('jsmockito');

    if(navigator.appVersion.indexOf("MSIE 8") === -1){
		var testCaseName = 'StudyTest';
		var CoreError = require('caplin/core/Error');
		var mockListener;
		var mockI18n;
		var subrealm;

		var testCase = {
			setUp: function() {
                JsHamcrest.Integration.JsTestDriver();
                JsMockito.Integration.JsTestDriver();

                mockListener = mock({
					onStudyData: function(/*study, data*/) {}
				});

                subrealm = realm.subrealm();
                subrealm.install();

                define('br/I18n', function(require, exports, module) {
					var i18n = subrealm.recast('br/I18n');
					module.exports = spy(i18n);
				});

                define('caplin/chart/Study', function(require, exports, module) {
					var Study = subrealm.recast('caplin/chart/Study');
					Study.prototype._emit = function(data) {
						this._listener.onStudyData(this, data);
					};
					module.exports = Study;
				});

                mockI18n = require('br/I18n');
            },

			tearDown: function() {
                subrealm.uninstall();
                subrealm = null;

                JsMockito.clearAllMocks();
            }
		};

		TestCase(testCaseName, testCase);
	}
})();
