/**
 * Load the constants
 */
var EventsCodes = require("../constants/events");

/**
 * Binlog DUMP Packet
 * @see  'COM_BINLOG_DUMP'
 * @param {Object} options
 */
function BinlogStart(options) {
  options = options || {};
  this.position = options.position || 4;

  // will send eof package if there is no more binlog event
  // https://dev.mysql.com/doc/internals/en/com-binlog-dump.html#binlog-dump-non-block
  this.flags = options.flags || 0;
  this.server_id = options.server_id || 1;
  this.filename = options.filename || '';
}

/**
 * When we write to the server, we send the
 * binlog start command.
 * @param  {Writer} writer Writer Object
 */
BinlogStart.prototype.write = function(writer) {
  writer.writeUnsignedNumber(1, EventsCodes.EXECUTE_LOAD_QUERY_EVENT);
  writer.writeUnsignedNumber(4, this.position);
  writer.writeUnsignedNumber(2, this.flags);
  writer.writeUnsignedNumber(4, this.server_id);
  writer.writeNullTerminatedString(this.filename);
};

/**
 * This is a one way packet
 * @throws {Error} If this is called
 */
BinlogStart.prototype.parse = function() {
  throw new Error("Cannot parser binlog commands!");
};

/**
 * Export the BinlogStart
 * @type {BinlogStart}
 */
module.exports = BinlogStart;