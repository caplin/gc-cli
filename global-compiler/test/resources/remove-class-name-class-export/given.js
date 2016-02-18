var Study = require('caplin/chart/Study');
var MapUtility = require('br/util/MapUtility');

function TestStudy(alias, derivationParams, listener, configOverrides) {
	var defaultOverrides = {
		representationNames: ['test-representation-name'],
		representationTypes: ['test-representation'],
		batchSize: 5
	};

	configOverrides = MapUtility.mergeMaps([defaultOverrides, configOverrides || {}], true);

	Study.call(this, alias, derivationParams, listener, configOverrides);
}
caplin.extend(TestStudy, Study);

caplin.chart.TestStudy = TestStudy;
module.exports = TestStudy;
