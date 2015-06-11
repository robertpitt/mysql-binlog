/**
 * Require dependancies
 */
var AbstractPacket  = require("./AbstractPacket"),
    EventsCodes     = require("../constants/events"),
    Field           = require("mysql/lib/protocol/packets/field"),
    Utilities       = require("../utilities"),
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
   * Handle V2 packet specifics
   */
  if(
    this.data.type === EventsCodes.UPDATE_ROWS_EVENT_V2 ||
    this.data.type === EventsCodes.DELETE_ROWS_EVENT_V2 ||
    this.data.type === EventsCodes.WRITE_ROWS_EVENT_V2
  ) {
    /**
     *  self.flags, self.extra_data_length = struct.unpack('<HH', self.packet.read(4))
     *  self.extra_data = self.packet.read(self.extra_data_length / 8)
     */
    var _extra_data_l = parser.parseUnsignedNumber(2);
    this.data.extra = parser.parseBuffer(_extra_data_l - 2);
  }

  /**
   * Discover the column counts for before and after
   */
  this.data.columns_length = parser.parseLengthCodedNumber();

  /**
   * Here we need to extract the table map
   */
  if(!parser._maps[this.data.table_id]) {
    // @todo we should not throw error here, need to implement
    // a skip packet method on the AbstractPacket that will end the packet
    // _offset and skip the event handling.
    throw new Error("Cannot use write/update/delete handlers without TableMap");
  }

  /**
   * Fetch the column bitmap size
   */
  var _bitmap_size = Math.floor((this.data.columns_length + 7) / 8);

  /**
   * Are we in an update packet
   * @type {Boolean}
   */
  var _isUpdatePacket = this.data.type === EventsCodes.UPDATE_ROWS_EVENT_V2;

  /**
   * Skip over the bitmaps for now and jump straight to
   * the rows
   */
  parser._offset = _isUpdatePacket ? _bitmap_size : _bitmap_size * 2;

  /**
   * If we have checksums enabled, we need to negate that from the data
   */
  if(parser._checksums)
    parser._packetEnd -= 4; // checksums are 4 bytes

  /**
   * Keep fetching rows until we are at the end of the packet
   */
  while(!parser.reachedPacketEnd())
    this._extractRow(parser, parser._maps[this.data.table_id]);

  /**
   * Set the offsets back so the parser actually closes correctly
   */
  if(parser._checksums) {
    parser._packetEnd += 4;
    parser._offset += 4;
  }
};

AbstractRowPacket.prototype._extractRow = function(parser, tableMap) {
  var row = {}, column, columnSchema;
  var nullBitmapSize = Math.floor((tableMap.column_count + 7) / 8);
  var nullBuffer = parser._buffer.slice(parser._offset, parser._offset + nullBitmapSize);
  var curNullByte, curBit;
  parser._offset += nullBitmapSize;

  console.log(tableMap.column_count);

  for (var i = 0; i < tableMap.column_count; i++) {
    curBit = i % 8;
    if(curBit === 0) curNullByte = nullBuffer.readUInt8(Math.floor(i / 8));

    column = tableMap.column_types[i];
    columnMeta = tableMap.column_metadata[i];

    if((curNullByte & (1 << curBit)) === 0){
      // row[i] = Utilities.readMysqlValue(parser, column, columnSchema);
    }else{
      row[i] = null;
    }
  }
  console.log("row", row);
  return row;
};

/**
 * Export the AbstractRowPacket
 * @type {AbstractRowPacket}
 */
exports = module.exports = AbstractRowPacket;