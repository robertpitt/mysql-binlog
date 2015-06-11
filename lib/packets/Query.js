/**
 * Require dependancies
 */
var AbstractPacket = require("./AbstractPacket.js"),
    Util = require("util");

/**
 * @type {Number}
 */
Query.TYPE = 0x02;

/**
 * Query Event
 */
function Query(parser, options) {
    AbstractPacket.apply(this, arguments);
}
Util.inherits(Query, AbstractPacket);

/**
 * Parse the Query event
 * @see https://dev.mysql.com/doc/internals/en/query-event.html
 * @param  {Parser} parser Parser
 * @return {void}
 */
Query.prototype.parse = function(parser) {
    /**
     * Call the parent method
     */
    AbstractPacket.prototype.parse.apply(this, arguments);

    /**
     * Parse basic query data
     */
    this.data.slave_proxy_id        = parser.parseUnsignedNumber(4);
    this.data.execution_time        = parser.parseUnsignedNumber(4);
    this.data.schema_length         = parser.parseUnsignedNumber(1);
    this.data.error_code            = parser.parseUnsignedNumber(2);
    this.data.status_vars_length    = parser.parseUnsignedNumber(2);

    /**
     * Payload data
     */
    parser.parseBuffer(this.data.status_vars_length);
    this.data.schema        = parser.parseString(this.data.schema_length);

    /**
     * Advance
     */
    parser.parseUnsignedNumber(1);

    /**
     * Fetch the query
     */
    this.data.query         = parser.parseString(this.data.size - 13 - this.data.status_vars_length - this.data.schema_length - 1);
};

/**
 * Export the Query Packet
 * @type {Query}
 */
exports = module.exports = Query;