/**
 * Binlog DUMP Packet
 * @see  'COM_BINLOG_DUMP'
 * @param {Object} options
 */
function BinlogStart(options) {
  options = options || {};
  this.command = 0x12;
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
  writer.writeUnsignedNumber(1, this.command);
  writer.writeUnsignedNumber(4, this.position);
  writer.writeUnsignedNumber(2, this.flags);
  writer.writeUnsignedNumber(4, this.server_id);
  writer.writeNullTerminatedString(this.filename);
};

/**
 * This is a slave only replciatioon
 * @throws {Error} If this is called
 */
BinlogStart.prototype.parse = function() {
  throw new Error("Cannot parser binlog commands!");
};

module.exports = BinlogStart;