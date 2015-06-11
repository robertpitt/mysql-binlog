/**
 * Require dependancies
 */
var AbstractRowPacket  = require("./AbstractRowPacket.js"),
    Util            = require("util");

/**
 * @type {Number}
 */
UpdateRows.TYPE = 0x1f;

/**
 * Base Event
 */
function UpdateRows(options) {
  //super()
  AbstractRowPacket.apply(this, arguments);

  /**
   * Update is slightly different in it has a
   * before and after row, let the parent Packet know
   * about this.
   * @type {Boolean}
   */
  this._multiple_rows = true;
};
Util.inherits(UpdateRows, AbstractRowPacket);

/**
 * Parse the update row packet
 * @see <todo:add-url>
 * @param  {Parser} parser Parser Instance
 * @return {void}
 */
UpdateRows.prototype.parse = function(parser) {
  /**
   * Call the base Parser
   */
  AbstractRowPacket.prototype.parse.apply(this, arguments);
};

/**
 * Export the UpdateRows Packet
 * @type {UpdateRows}
 */
exports = module.exports = UpdateRows;