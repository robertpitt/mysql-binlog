/**
 * Base Event
 */
function BaseParser(parser, header) {
	/**
	 * Set teh timestamp value
	 * @type {Number}
	 */
	this.timestamp = header.timestamp;

	/**
	 * Next position
	 * @type {Number}
	 */
	this.nextPosition = header.nextPosition;

	/**
	 * Packet body size
	 * @type {Number}
	 */
	this.size = header.size;

	/**
	 * Set the parser instance
	 */
	this.parser = parser;
}

BaseParser.prototype.parseUInt64 = function() {
  var low = this.parser.parseUnsignedNumber(4);
  var high = this.parser.parseUnsignedNumber(4);

  // jshint bitwise: false
  return (high * Math.pow(2,32)) + low;
};

module.exports = BaseParser;