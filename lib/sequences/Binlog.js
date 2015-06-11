/**
 * Binlog Parser
 */

/**
 * Require deps
 */
var Sequences = require("mysql/lib/protocol/sequences"),
    Packets    = require("../packets")
    Util = require("util");

module.exports = Binlog;

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
   * Set the options
   */
  this._position    = options.binlog_position   || 4;
  this._server_id   = options.server_id         || 1;
  this._filename    = options.binlog_file       || "";
  this._flags       = options.non_blocking      ? 1 : 0;
  this._checksums   = options.chucksums_enabled ? true : false;

  /**
   * Fetch the parsers
   */
  this._parsers = options.parsers;
}
Util.inherits(Binlog, Sequences.Sequence);

/**
 * When the protocol starts teh sequence
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
Binlog.prototype.determinePacket = function(byte) {

    //OkPacket === 0x00
    if(byte === 0x00) {
        return Packets.BinlogEvent(this);
    }

    // Let the default handler handle it.
    return Sequences.Sequence.determinePacket(byte);
};

/**
 * BinLogEvent handler
 * @param {Packet} packet Packet Instance
 */
Binlog.prototype.BinlogEvent = function(parser) {
    if (this._callback) {
      var event, error;
      try{
        event = parser.getEvent();
      }catch(err){
        error = err;
      }
      this._callback.call(this, error, event);
    }
};

/**
 * @todo What to do when we get one of these packets
 * @param {Parser} parser Parser
 */
Binlog.prototype.EofPacket = function(parser){
    console.log("Got EOF packet");
}