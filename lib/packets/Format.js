/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
	Util = require("util");

/**
 * Format Event
 */
function Format(parser, options) {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(Format, AbstractPacket);

/**
 * Parse the format packet
 * @see https://dev.mysql.com/doc/internals/en/format-description-event.html
 * @param  {Parser} parser Parser Instance
 * @return {void}
 */
Format.prototype.parse = function(parser) {
	/**
	 * Call the parent method
	 */
	AbstractPacket.prototype.parse.apply(this, arguments);

	/**
	 * Parse the binlog version
	 * @type {Number}
	 */
	this.data.binlog_version = parser.parseUnsignedNumber(2);

	/**
	 * Parse the server version
	 * @type {String}
	 */
	this.data.mysql_server_version = parser.parseString(50);

	/**
	 * Creation timestamp
	 * @type {Number}
	 */
	this.data.create_timestamp = parser.parseUnsignedNumber(4)* 1000;

	/**
	 * Binlog header length, should always be 19
	 * @type {Number}
	 */
	this.data.binlog_header_length = parser.parseUnsignedNumber(1);
};

/**
 * @type {Number}
 */
Format.TYPE = 0x0f;

exports = module.exports = Format;