/**
 * Export
 */
module.exports = function(binlogSequence){
	/**
	 * Binlog packet handler
	 */
	function BinlogEvent(options) {}

	/**
	 * Parse the packet
	 */
	BinlogEvent.prototype.parse = function(parser) {

		/**
		 * Parse the header
		 */
		var header = this.parseHeader(parser);

		/**
		 * Do we have an active parser enabled
		 */
		if(header.eventType in binlogSequence._parsers) {
			/**
			 * Event Class
			 */
			var _eventClass = binlogSequence._parsers[header.eventType];

			/**
			 * Set the event as 
			 */
			try{
				this._event = new _eventClass(parser, header);
			}catch(e){ this._error = e;}
			return;
		}

		console.log("No parser found: %s", header.eventType);
	};

	/**
	 * Parse packet header
	 * @param  {Parser} parser IO Stream Parser
	 * @return {Object}        Parsed header.
	 */
	BinlogEvent.prototype.parseHeader = function(parser) {
	    // uint8_t  marker; // always 0 or 0xFF
	    // uint32_t timestamp;
	    // uint8_t  type_code;
	    // uint32_t server_id;
	    // uint32_t event_length;
	    // uint32_t next_position;
	    // uint16_t flags;
	    parser.parseUnsignedNumber(1);

	    var timestamp = parser.parseUnsignedNumber(4) * 1000;
	    var eventType = parser.parseUnsignedNumber(1);
	    var serverId = parser.parseUnsignedNumber(4);
	    var eventLength = parser.parseUnsignedNumber(4);
	    var nextPosition = parser.parseUnsignedNumber(4);
	    var flags = parser.parseUnsignedNumber(2);

	    // headerLength doesn't count marker
	    var headerLength = 19;
	    // for MySQL 5.6 and binlog-checksum = CRC32
	    if (binlogSequence._checksums) {
	      headerLength += 4;
	    }
	    var eventSize = eventLength - headerLength;

	    var options = {
	      timestamp: timestamp,
	      nextPosition: nextPosition,
	      size: eventSize,
	      eventType: eventType
	    };

	    /**
	     * Return the header
	     */
	    return options;
	}

	BinlogEvent.prototype.getEvent = function() {
		if(this._error) throw this._error;

		return this._event;
	};

	BinlogEvent.prototype.write = function(writer) {
		throw new Error("Cannot write to binlog stream, receive only.");
	};

	return BinlogEvent;

};