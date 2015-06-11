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

Binlog.prototype.Xid = function(packet) {
  console.log("Xid packet", packet);
};

Binlog.prototype.Format = function(packet) {
  // console.log("Format packet", packet);
};

Binlog.prototype.Rotate = function(packet) {
  // console.log("Rotate packet");
};

Binlog.prototype.Query = function(packet) {
  console.log("Query packet", packet.getData());
};

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

Binlog.prototype.Stop = function(packet) {
  console.log("Stop packet", packet);
};

Binlog.prototype['OkPacket'] = function(packet) {
};

Binlog.prototype['ErrorPacket'] = function(packet) {
  return Sequences.Sequence.prototype.ErrorPacket.call(this, packet);
};

/**
 * @todo What to do when we get one of these packets
 * @param {Parser} parser Parser
 */
Binlog.prototype.EofPacket = function(packet){
    console.log("Got EOF packet");
}

/**
 * Export the module
 */
exports = module.exports = Binlog;