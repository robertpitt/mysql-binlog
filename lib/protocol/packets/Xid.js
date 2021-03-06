/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
    EventsCodes    = require("../constants/events"),
    Util           = require("util");

/**
 * @type {Number}
 */
Xid.TYPE = EventsCodes.XID_EVENT;

/**
 * Xid Event
 */
function Xid() {
  AbstractPacket.apply(this, arguments);
}
Util.inherits(Xid, AbstractPacket);

Xid.prototype.parse = function(parser) {
  /**
   * Call the parent method
   */
  AbstractPacket.prototype.parse.apply(this, arguments);

  /**
   * Parse the Xid
   * @type {Number}
   */
  this.data.xid = this.parseUInt64(parser);
};

/**
 * Export the Xid Packet
 * @type {Xid}
 */
exports = module.exports = Xid;