/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	Util = require("util");

/**
 * Event Type
 * @type {Number}
 */
Rotate.TYPE = 0x04;

/**
 * Rotate Event
 */
function Rotate() {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(Rotate, AbstractPacket);

/**
 * Parse the Roate packet
 * @see https://dev.mysql.com/doc/internals/en/rotate-event.html
 * @param  {Parser} parser Parser
 * @return {void}
 */
Rotate.prototype.parse = function(parser) {
	/**
	 * Call the parent method
	 */
	AbstractPacket.prototype.parse.apply(this, arguments);

	/**
	 * Parse the new position
	 * @type {Number}
	 */
	this.data.position = this.parseUInt64(parser);

	/**
	 * Parse the new binlog gile name
	 * @type {String}
	 */
	this.data.binlog_file = parser.parseString(this.size - 8);
};

exports = module.exports = Rotate;