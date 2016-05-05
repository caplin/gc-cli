var menuConfig = {
	alias: 'caplinps.collapsible-menu-model',
	options: {
		label: i18n('caplinx.menu.insert.grid'),
		classifier: 'sub-menu',
		collapsed: true
	},
	items: []
};

function test(item) {
	var name = item.getClassifier();
	var xml = '<caplin.grid-component baseGrid="' + name + '" />';

	var component = ComponentFactory.createComponent(xml);
	var layoutService = require('service!caplin.layout-service');
	var layout = layoutService.getSelected();
}
