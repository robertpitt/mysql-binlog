/**
 * Require dependancies
 */
var AbstractPacket  = require("./AbstractPacket"),
    Util            = require("util");

/**
 * Base Event
 */
function AbstractRowPacket(options) {
  //super()
  AbstractPacket.apply(this, arguments);
};
Util.inherits(AbstractRowPacket, AbstractPacket);

AbstractRowPacket.prototype.parse = function(parser) {
  /**
   * Call the base Parser
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
	 * Skip the extra data provided in V2 events
	 */
	if(this.data.type === 0x1e || this.data.type === 0x1f || this.data.type === 0x20) {
		parser.parseBuffer(
			// this value is the extra data length
			parser.parseUnsignedNumber(2) - 2
		);
	}

	/**
	 * Number of columns in the table
	 * @type {Number}
	 */
	this.data.number_of_columns = parser.parseLengthCodedNumber();

	/**
	 * If we do not have a map we should skip this event
	 */
	if(!(this.data.table_id in parser._maps)) {
		parser._offset = parser._packetEnd;
		return ;
	}

	/**
	 * Bitmap Size
	 */
	var columnsPresentBitmapSize = Math.floor((this.data.number_of_columns + 7) / 8);

    // Columns present bitmap exceeds 4 bytes with >32 rows
    // And is not handled anyways so just skip over its space
    parser._offset += columnsPresentBitmapSize;

    if(this._multiple_rows) {
      // UpdateRows event slightly different, has new and old rows represented
      parser._offset += columnsPresentBitmapSize;
    }

    if(parser._checksums){
      // Ignore the checksum at the end of this packet
      parser._packetEnd -= 4;
    }

    this.data.rows = [];

	while (!parser.reachedPacketEnd()) {
		this.data.rows.push(this._parseRow(parser));
	}

    if(parser._checksums){
      // Skip past the checksum at the end of the packet
      parser._packetEnd += 4;
      parser._offset += 4;
    }

    console.log(this);
};

AbstractRowPacket.prototype._parseRow = function(parser) {
	/**
	 * Define the propertues
	 * @type {Object}
	 */
	var row = {}, column, columnSchema;

	/**
	 * Fetch teh table map
	 * @type {Object}
	 */
	var map = parser._maps[this.data.table_id];

	console.log(this.data.type, map);
};

exports = module.exports = AbstractRowPacket;