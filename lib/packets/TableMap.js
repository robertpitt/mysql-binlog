/**
 * Require dependancies
 */
var AbstractPacket 		= require("./AbstractPacket.js"),
	Util 			= require("util");

/**
 * @type {Number}
 */
TableMap.TYPE = 0x13;

/**
 * TableMap Event
 */
function TableMap() {
	AbstractPacket.apply(this, arguments);
}
Util.inherits(TableMap, AbstractPacket);

/**
 * Parse teh TableMap event
 * @see https://dev.mysql.com/doc/internals/en/table-map-event.html
 * @param  {Parser} parser Parser
 * @return {void}
 */
TableMap.prototype.parse = function(parser) {
	/**
	 * Call the parent method
	 */
	AbstractPacket.prototype.parse.apply(this, arguments);

	/**
	 * Read the table ID
	 * @type {Number}
	 */
	this.data.table_id = this.readTableId(parser);

	/**
	 * Read the flags
	 * @type {Number}
	 */
	this.data.flags = parser.parseUnsignedNumber(2);

	/**
	 * Read the schema
	 * @type {String}
	 */
	this.data.schema = this.readSchemaName(parser);

	/**
	 * Read the table name
	 * @type {String}
	 */
	this.data.table = this.readTableName(parser);

	/**
	 * @todo Filter out the rest of the of packet
	 *       if this schema/table is filtered
	 */
	
	/**
	 * Advance
	 */
	parser.parseUnsignedNumber(1);

	// console.log(parser._offset, parser._buffer.toString("utf8"));

	/**
	 * Column Counts
	 * @type {Number}
	 */
	this.data.column_count = parser.parseLengthCodedNumber();

	/**
	 * Column Types
	 * @type {Array}
	 */
    this.data.column_types = this.parseBytesArray(parser, this.column_count);

	/**
	 * Advance
	 */
	parser.parseUnsignedNumber(1);

    /**
     * Parse the column meta information
     * @type {Object}
     */
    this.data.column_meta = this.data.column_types.map(function(code){
    	return this.readColumnMeta(parser, code);
    }.bind(this));
};

/**
 * Export the TableMap Packet
 * @type {TableMap}
 */
exports = module.exports = TableMap;