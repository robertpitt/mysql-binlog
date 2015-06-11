/**
 * Connection class
 */

/**
 * Require deps
 */
var util             = require("util"),
    Sequences        = require("./protocol/sequences"),
    BaseConnection   = require("mysql/lib/Connection"),
    ConnectionConfig = require("mysql/lib/ConnectionConfig");

/**
 * Create a new Connection instance.
 * @param {object} config
 * @public
 */
exports.create = function createConnection(config) {
    return new Connection({config: new ConnectionConfig(config)});
};

function bindToCurrentDomain(callback) {
  if (!callback) return;

  var domain = process.domain;
  return domain ? domain.bind(callback) : callback;
}

/**
 * Connection to MySQL
 * @param {Object|String} config Configuration.
 */
function Connection(config){
  /**
   * Create a new connection
   */
  BaseConnection.call(this, config);
};
util.inherits(Connection, BaseConnection);

/**
 * Enqueue the binlog sequence
 * @param  {Options}   options  Binlog options
 * @param  {Function}  callback Callback
 */
Connection.prototype.binlog = function(options, callback) {
  var cb = bindToCurrentDomain(callback);
  var options = options || {};

  /**
   * Assure we are connected
   */
  this._implyConnect();

  /**
   * Make sure binlog checksum is enabled for this Sequence.
   */
  this.query("set @master_binlog_checksum=@@global.binlog_checksum", function(){
    return this._protocol._enqueue(
      /**
       * Enqueue the binlog sequence
       */
      new Sequences.Binlog(options, callback)
    );
  }.bind(this));
};