var Interface = require("my/long/Interface");
var SuperClass = require("my/long/name/space/SuperClass");
var getFileContents = require("caplin/getFileContents");
var TicketLauncher = require("caplin/trading/ticket/TicketLauncher");
var PropertyHelper = require("caplin/presenter/property/PropertyHelper");
var topiarist = require("topiarist");

function SimpleClass() {
	this._service = require("service!test.alias");
	this.m_oPropertyHelper = new PropertyHelper;

	var proxy = require("service!caplin.event-service")
		.getProxy('caplin.trading.ticket.TicketLauncher', 'caplinx.launch.OrderTicket', TicketLauncher);

	getFileContents();
}

topiarist.extend(SimpleClass, SuperClass);
topiarist.inherit(SimpleClass, Interface);

SimpleClass.prototype.myMethod = function() {}

SimpleClass.prototype.anotherMethod = function() {}
module.exports = SimpleClass;
