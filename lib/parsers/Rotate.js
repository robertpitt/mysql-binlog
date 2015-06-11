/**
 * Require dependancies
 */
var BaseParser = require("./BaseParser.js"),
	Util = require("util");

/**
 * Base Event
 *
 * @see https://dev.mysql.com/doc/internals/en/binlog-network-stream.html
 */
function Rotate(parser, options) {
	BaseParser.apply(this, arguments);

	/**
	 * Parse the new position
	 */
	this.position = this.parseUInt64();
	console.log(this.size);
	this.binlogName = this.parser.parseString(this.size - 8);

	// Read the end of the packet
	console.log(this.parser._buffer.toString('hex'));
	console.log("rotate event: %s %s", this.position, this.binlogName);
}
Util.inherits(Rotate, BaseParser);

/**
 * @see https://dev.mysql.com/doc/internals/en/binlog-event-type.html
 * @type {Number}
 */
Rotate.TYPE = 0x04;

exports = module.exports = Rotate;