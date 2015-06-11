/**
 * Binlog Parser
 */

/**
 * Require deps
 */
var Sequences = require("mysql/lib/protocol/sequences"),
    Packets    = require("../packets")
    Util = require("util");

/**
 * Binlog Sequence
 * @param {Object}   options  Binlog Options
 * @param {Function} callback When packet is decrypted
 */
function Binlog(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  /**
   * Default options
   */
  options = options || {};

  /**
   * Call the super()
   */
  Sequences.Sequence.call(this, callback);

  /**
   * Set the options locally.
   */
  this._position    = options.binlog_position   || 4;
  this._server_id   = options.server_id         || 1;
  this._filename    = options.binlog_file       || "";
  this._flags       = options.non_blocking      ? 1 : 0;
  this._checksums   = options.checksum_enabled  ? true : false;

  /**
   * Table map container, this is used by events to lookup
   * extra row data based on the tablerow event that was
   * received in a preveius packet
   */
  this._maps = {};

  /**
   * Fetch the parsers
   * @type {Object}
   */
  this._parsers = options.parsers;
}
Util.inherits(Binlog, Sequences.Sequence);

/**
 * When the protocol starts the sequence
 * we send the binlog initialization data to the server
 *
 * this informs the server that we are in binlog mode.
 */
Binlog.prototype.start = function() {
    this.emit('packet', new Packets.BinlogStart({
      position    : this._position,
      server_id   : this._server_id,
      filename    : this._filename,
      falgs       : this._flags
    }));
};

/**
 * When receiving a packet from mysql, we check to
 * see if the first
 * @param  {[type]} firstByte [description]
 * @return {[type]}           [description]
 */
Binlog.prototype.determinePacket = function(byte, parser) {
    /**
     * Peak into the buffer to locate the packet type.
     */
    var type = parser._buffer[parser._offset + 5];

    if(byte === 0x00) {
      /**
       * Check to see if we have a packet handler
       */
      if(type in this._parsers){
        console.log("Handling event: ", this._parsers[type].name);
        /**
         * Assign the meta data to the parser
         * @type {[type]}
         */
        parser._checksums = this._checksums;

        /**
         * Add a reference to the table map to the parser
         * so each packet can access them.
         */
        parser._maps = this._maps;

        /**
         * Return the Packet Class
         */
        return this._parsers[type];
      }
    }

    // Let the default handler handle it.
    return Sequences.Sequence.determinePacket(byte);
};

/**
 * Xid Packet Handler (after deserialization)
 * @param {AbstractPacket} packet
 */
Binlog.prototype.Xid = function(packet) {};

/**
 * Format Packet Handler (after deserialization)
 * @param {Format} packet
 */
Binlog.prototype.Format = function(packet) {};

/**
 * Rotate Packet Handler (after deserialization)
 * @param {Rotate} packet
 */
Binlog.prototype.Rotate = function(packet) {};

/**
 * Query Packet Handler (after deserialization)
 * @param {Query} packet
 */
Binlog.prototype.Query = function(packet) {};

/**
 * TableMap Packet Handler (after deserialization)
 * @param {TableMap} packet
 */
Binlog.prototype.TableMap = function(packet) {
  /**
   * Check to see if hte table map is within the
   * maps namespace.
   */
  if(!(packet.getData().table_id in this._maps)) {
    /**
     * @todo Should we overwrite the map,
     *       does it change, can we use the checksum
     *       to see if it's different... thinking of
     *       alloc resources reduction here.
     */
    this._maps[packet.getData().table_id] = packet.getData();
  }
};

/**
 * Stop Packet Handler (after deserialization)
 * @param {AbstractPacket} packet
 */
Binlog.prototype.Stop = function(packet) {};

/**
 * OkPacket Packet Handler (after deserialization)
 *
 * Note: We have to have these packet handlers regsitered
 *       here as they are part of the BinLog Sequence protocol.
 * 
 * @param {OkPacket} packet
 */
Binlog.prototype.OkPacket = function(packet) {};

/**
 * Error Packet Handler (after deserialization)
 *
 * Note: We have to have these packet handlers regsitered
 *       here as they are part of the BinLog Sequence protocol.
 * 
 * @param {ErrorPacket} packet
 */
Binlog.prototype.ErrorPacket = function(packet) {
};

/**
 * Eof Packet Handler (after deserialization)
 * @param {EofPacket} packet
 */
Binlog.prototype.EofPacket = function(packet){}

/**
 * Export the module
 */
exports = module.exports = Binlog;