/**
 * Binlog class
 */

/**
 * Require deps
 */
var _           = require("underscore"),
    Async       = require("async"),
    Connection  = require("./connection.js");

/**
 * Binlog client
 * @param {Object} connection Connection options
 */
function Binlog(connection, options){
    /**
     * Default options
     * @type {Object}
     */
    this._options = _.extend(_.clone(options || {}), {

        /**
         * Binlog file to start with
         */
        binlog_file: "",

        /**
         * Default binlog position
         * @type {Number}
         */
        binlog_position: 4,

        /**
         * Server identifier
         * @type {Number}
         */
        server_id: 1,

        /**
         * Parsers
         */
        parsers: {},

        /**
         * Are checksums enabled
         * @type {Boolean}
         */
        checksum_enabled: false
    });

    /**
     * Create the connecton
     */
    this._connection = Connection.create(connection);

    /**
     * Initialization queries
     */
    this._initializationQueries = [
        "select @@GLOBAL.binlog_checksum as checksum",
        "SHOW MASTER STATUS"
    ];

    /**
     * Create a seperate connection to perform setting
     * lookups such as binlog positions and schema definitions.
     */
    this._control_connection = Connection.create(_.extend(connection, {
        database: "information_schema",
        multipleStatements: true
    }));

    /**
     * Boolean to depict if we have initialized
     */
    this._initialized = false;

    /**
     * Has the start method already been called?
     */
    this._started = false;

    /**
     * Initialize
     */
    this._initialize();
}

/**
 * Assign the parsers
 */
Binlog.Packets = require("./protocol/packets");

/**
 * Initialize the binlog parser
 */
Binlog.prototype._initialize = function() {

    /**
     * Connect the control connection.
     */
    this._control_connection.connect();

    /**
     * Fetch the initial set of 
     */
    this._control_connection.query(this._initializationQueries.join(";"), function(err, results){
        /**
         * Configure checksums
         */
        this._options.checksum_enabled = results[0][0].checksums === "NONE" ? false : true;

        /**
         * Start at the end of the binlog if a file has not
         * been specified.
         */
        if(!this._options.binlog_file) {
            this._options.binlog_file     = results[1][0].File;
            this._options.binlog_position = results[1][0].Position;
        }

        /**
         * Initialization complete
         */
        this._initializeComplete();
    }.bind(this));
};

/**
 * Setup completed
 */
Binlog.prototype._initializeComplete = function() {
    /**
     * Mark the initialization as true
     */
    this._initialized = true;
};

/**
 * Register an event handler
 */
Binlog.prototype.use = function(parser) {
    this._options.parsers[parser.TYPE] = parser;
};

/**
 * Start the binlog parsing
 */
Binlog.prototype.start = function() {
    /**
     * Skip if we are already running
     */
    if(this._started === true)
        return true;

    /**
     * Create a loop to recall the start when it's initialzied
     */
    if(this._initialized === false)
        return setTimeout(this.start.bind(this), 50);

    /**
     * We are now live.
     * @type {Boolean}
     */
    this._started = true;

    /**
     * Add the binlog parser to the procol
     */
    this._connection.binlog(this._options, this._onBinlogEvent.bind(this))
};

/**
 * Start the binlog parsing
 */
Binlog.prototype.stop = function() {
    
};

Binlog.prototype._onBinlogEvent = function(err) {
    if(err) throw err;
};

/**
 * Export the class
 */
exports = module.exports = Binlog;