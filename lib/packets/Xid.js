/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	Util = require("util");

/**
 * Xid Event
 */
function Xid() {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(Xid, AbstractPacket);

Xid.prototype.parse = function(parser) {
	/**
	 * Call the parent method
	 */
	AbstractPacket.prototype.parse.apply(this, arguments);

	/**
	 * Parse the Xid
	 * @type {Number}
	 */
	this.data.xid = this.parseUInt64(parser);
};

/**
 * @type {Number}
 */
Xid.TYPE = 0x10;

exports = module.exports = Xid;