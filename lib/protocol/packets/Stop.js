/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	EventsCodes = require("../constants/events"),
	Util = require("util");

/**
 * @type {Number}
 */
Stop.TYPE = EventsCodes.STOP_EVENT;

/**
 * Stop Event
 */
function Stop(parser, options) {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(Stop, AbstractPacket);

/**
 * Export the Stop Packet
 * @type {Stop}
 */
exports = module.exports = Stop;