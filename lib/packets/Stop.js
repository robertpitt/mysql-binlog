/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	Util = require("util");

/**
 * Stop Event
 */
function Stop(parser, options) {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(Stop, AbstractPacket);

/**
 * @type {Number}
 */
Stop.TYPE = 0x03;

exports = module.exports = Stop;