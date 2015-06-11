/**
 * Require dependancies
 */
var Types = require("mysql/lib/protocol/constants/types");

/**
 * Base Event
 */
function AbstractPacket(options) {

  /**
   * Event Instance
   * @type {Event}
   */
  this.data = {};

  /**
   * Error Instance
   * @type {Event}
   */
  this.error = null;
};

/**
 * Base parser
 */
AbstractPacket.prototype.parse = function(parser) {
	/**
	 * Read the header
	 */
	this._readHeader(parser);
};

/**
 * Read the remaining header
 */
AbstractPacket.prototype._readHeader = function(parser) {
    /**
     * Check the timestamp and checksums out from the parser
     */
    parser.parseUnsignedNumber(1);

    /**
     * Read the remaining header
     */
    this.data.timestamp    = parser.parseUnsignedNumber(4) * 1000;
    this.data.type         = parser.parseUnsignedNumber(1);
    this.data.server_id 	  = parser.parseUnsignedNumber(4);
    this.data.event_length = parser.parseUnsignedNumber(4);
    this.data.next_position= parser.parseUnsignedNumber(4);
    this.data.flags 			  = parser.parseUnsignedNumber(2);

    /**
     * Calculate the payload size
     */
    var headerLength = 19;
    if (parser._checksums) {
      headerLength += 4;
    }

    this.data.size = this.data.event_length - headerLength;
};

AbstractPacket.prototype.getData = function(){
  if(this.error) throw this.error;
  return this.data;
}

/**
 * Convert type code to type string
 * @param  {Number} code Type code
 * @return {String}      Type String
 */
AbstractPacket.typeToString = function(code) {
  for (var k in Types) {
    if (Types[k] == code) return k;
  }
};

/**
 * Reads the table id
 * @return {Number} Table ID
 */
AbstractPacket.prototype.readTableId = function(parser) {
	return this.parseUInt48(parser);
};

/**
 * Read the schema name
 * @return {Schema} Schema Name
 */
AbstractPacket.prototype.readSchemaName = function(parser) {
	var schema = parser.parseString(
		parser.parseUnsignedNumber(1)
	);
	parser.parseUnsignedNumber(1);
	return schema;
};

/**
 * Read teh table name
 * @return {String} Table Name
 */
AbstractPacket.prototype.readTableName = function(parser) {
  return parser.parseString(
  	parser.parseUnsignedNumber(1)
  );
};

AbstractPacket.prototype.readColumnMeta = function(parser, code) {
	/**
	 * Fetch the column
	 */
	switch (AbstractPacket.typeToString(code)) {
      case 'FLOAT':
      case 'DOUBLE':
        return {
          size: parser.parseUnsignedNumber(1)
        };
        break;
      case 'VAR_STRING':
        return {
          'max_length': parser.parseUnsignedNumber(2)
        };
        break;
      case 'BIT':
        var bits = parser.parseUnsignedNumber(1);
        var bytes = parser.parseUnsignedNumber(1);
        return {
          bits: bytes * 8 + bits
        };
        break;
      case 'NEWDECIMAL':
        return {
          precision: parser.parseUnsignedNumber(1),
          decimals: parser.parseUnsignedNumber(1),
        };
        break;
      case 'BLOB':
      case 'GEOMETRY':
        return {
          'length_size': parser.parseUnsignedNumber(1)
        };
        break;
      case 'STRING':
      case 'VAR_STRING':
        // The STRING type sets a 'real_type' field to indicate the
        // actual type which is fundamentally incompatible with STRING
        // parsing. Setting a 'type' key in this hash will cause
        // TableMap event to override the main field 'type' with the
        // provided 'type' here.
        var metadata = (parser.parseUnsignedNumber(1) << 8) + parser.parseUnsignedNumber(1);
        var realType = metadata >> 8;
        var typeName = AbstractPacket.typeToString(realType);
        if (typeName === 'ENUM' || typeName === 'SET') {
          result = {
            type: realType,
            size: metadata & 0x00ff
          };
        } else {
          return {
            'max_length': ((
              (metadata >> 4) & 0x300) ^ 0x300) + (metadata & 0x00ff)
          };
        }
        break;
        case 'DATE':
        case 'DATETIME':
        case 'TIMESTAMP':
	        return {
	          decimals: parser.parseUnsignedNumber(1)
	        };
        break;
    }

    return {};
};

AbstractPacket.prototype.parseBytesArray = function(parser, length) {
	/**
	 * Create a new stack
	 * @type {Array}
	 */
	var result = new Array(length);
	for (var i = 0; i < length; i++) {
		result[i] = parser.parseUnsignedNumber(1);
	}

	return result;
};

/**
 * Read a UINT64 bit
 * @return {[type]} [description]
 */
AbstractPacket.prototype.parseUInt64 = function(parser) {
  var low = parser.parseUnsignedNumber(4);
  var high = parser.parseUnsignedNumber(4);

  return (high * Math.pow(2,32)) + low;
};

/**
 * Read a UINT 48 bit
 */
AbstractPacket.prototype.parseUInt48 = function(parser) {
  var low = parser.parseUnsignedNumber(4);
  var high = parser.parseUnsignedNumber(2);

  return (high * Math.pow(2, 32)) + low;
};


module.exports = AbstractPacket;