/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	Util = require("util");

/**
 * @type {Number}
 */
Stop.TYPE = 0x03;

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