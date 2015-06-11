/**
 * Require dependancies
 */
var AbstractPacket  = require("./AbstractPacket.js"),
  EventsCodes       = require("../constants/events"),
  Types             = require("mysql/lib/protocol/constants/types"),
  Utilities         = require("../utilities"),
  Util              = require("util");

/**
 * @type {Number}
 */
TableMap.TYPE = EventsCodes.TABLE_MAP_EVENT;

/**
 * TableMap Event
 */
function TableMap() {
  AbstractPacket.apply(this, arguments);

  /**
   * Column meta data information
   * @type {Array}
   */
  this.data.column_metadata = [];
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
  this.data.column_types = Utilities.parseBytesArray(parser, this.data.column_count);

  /**
   * Advance
   */
  parser.parseUnsignedNumber(1);

  /**
   * Parse the column meta information
   * @type {Object}
   */
  this._readColumnMetadata(parser);
};

TableMap.prototype._readColumnMetadata = function(parser) {
  /**
   * Read the definitions of each column in the current packet.
   */
  for(var i = 0; i < this.data.column_types.length; i++) {
    /**
     * exports.DECIMAL     = 0x00; // aka DECIMAL (http://dev.mysql.com/doc/refman/5.0/en/precision-math-decimal-changes.html)
     * exports.TINY        = 0x01; // aka TINYINT, 1 byte
     * exports.SHORT       = 0x02; // aka SMALLINT, 2 bytes
     * exports.LONG        = 0x03; // aka INT, 4 bytes
     * exports.FLOAT       = 0x04; // aka FLOAT, 4-8 bytes
     * exports.DOUBLE      = 0x05; // aka DOUBLE, 8 bytes
     * exports.NULL        = 0x06; // NULL (used for prepared statements, I think)
     * exports.TIMESTAMP   = 0x07; // aka TIMESTAMP
     * exports.LONGLONG    = 0x08; // aka BIGINT, 8 bytes
     * exports.INT24       = 0x09; // aka MEDIUMINT, 3 bytes
     * exports.DATE        = 0x0a; // aka DATE
     * exports.TIME        = 0x0b; // aka TIME
     * exports.DATETIME    = 0x0c; // aka DATETIME
     * exports.YEAR        = 0x0d; // aka YEAR, 1 byte (don't ask)
     * exports.NEWDATE     = 0x0e; // aka ?
     * exports.VARCHAR     = 0x0f; // aka VARCHAR (?)
     * exports.BIT         = 0x10; // aka BIT, 1-8 byte
     * exports.NEWDECIMAL  = 0xf6; // aka DECIMAL
     * exports.ENUM        = 0xf7; // aka ENUM
     * exports.SET         = 0xf8; // aka SET
     * exports.TINY_BLOB   = 0xf9; // aka TINYBLOB, TINYTEXT
     * exports.MEDIUM_BLOB = 0xfa; // aka MEDIUMBLOB, MEDIUMTEXT
     * exports.LONG_BLOB   = 0xfb; // aka LONGBLOG, LONGTEXT
     * exports.BLOB        = 0xfc; // aka BLOB, TEXT
     * exports.VAR_STRING  = 0xfd; // aka VARCHAR, VARBINARY
     * exports.STRING      = 0xfe; // aka CHAR, BINARY
     * exports.GEOMETRY    = 0xff; // aka GEOMETRY
     */

    /**
     * @todo Change this op to something other than a
     *       switch statement.
     */
    switch(this.data.column_types[i]) {
      case Types.FLOAT:
      case Types.DOUBLE:
        this.data.column_metadata[i] = {
          size: parser.parseUnsignedNumber(1)
        }
      break;

      case Types.VARCHAR:
         this.data.column_metadata[i] = {
          max_length: parser.parseUnsignedNumber(2)
        };
      break;

      case Types.BIT:// @todo parse both in buffer then parseInt
        var bits = parser.parseUnsignedNumber(1);
        var bytes = parser.parseUnsignedNumber(1);
        this.data.column_metadata[i] = {
          bits: bytes * 8 + bits
        };
      break;

      case Types.NEWDECIMAL:
        this.data.column_metadata[i] = {
          precision: parser.parseUnsignedNumber(1),
          decimals: parser.parseUnsignedNumber(1),
        };
      break;

      case Types.BLOB:
      case Types.GEOMETRY:
        this.data.column_metadata[i] = {
          length_size: parser.parseUnsignedNumber(1)
        };
      break;

      case Types.VAR_STRING:
      case Types.STRING:
        // The STRING type sets a 'real_type' field to indicate the
        // actual type which is fundamentally incompatible with STRING
        // parsing. Setting a 'type' key in this hash will cause
        // TableMap event to override the main field 'type' with the
        // provided 'type' here.
        var metadata = (parser.parseUnsignedNumber(1) << 8) + parser.parseUnsignedNumber(1);
        var realType = metadata >> 8;
        if (realType === Types.ENUM || realType === Types.SET) {
          this.data.column_metadata[i] = {
            type: realType,
            size: metadata & 0x00ff
          };
        } else {
          this.data.column_metadata[i] = {
            max_length: (((metadata >> 4) & 0x300) ^ 0x300) + (metadata & 0x00ff)
          };
        }
      break;

      case Types.TIMESTAMP:
      case Types.DATETIME:
        this.data.column_metadata[i] = {
          decimals: parser.parseUnsignedNumber(1)
        };
      break;
      default:
        /**
         * Default the value to null
         */
        this.data.column_metadata[i] = null;
        console.log("Unknown Type: ", this.data.column_types[i]);
      break
    }
  }
};

/**
 * Export the TableMap Packet
 * @type {TableMap}
 */
exports = module.exports = TableMap;