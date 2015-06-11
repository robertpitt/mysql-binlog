/**
 * Utility helper(s) for decoding packets 
 */
var Types = require("mysql/lib/protocol/constants/types");

/**
 * Utilities namespace with export to parent scope.
 * @type {Object}
 */
var Utilities = exports = module.exports = {};

/**
 * [parseUInt64 description]
 * @param  {[type]} parser [description]
 * @return {[type]}        [description]
 */
Utilities.parseUInt64 = function(parser) {
  var low = parser.parseUnsignedNumber(4);
  var high = parser.parseUnsignedNumber(4);

  if(this){
    // Pass extra output to context
    this.low = low;
    this.high = high;
  }

  // jshint bitwise: false
  return (high * Math.pow(2,32)) + low;
};

/**
 * [parseUInt48 description]
 * @param  {[type]} parser [description]
 * @return {[type]}        [description]
 */
Utilities.parseUInt48 = function(parser) {
  var low = parser.parseUnsignedNumber(4);
  var high = parser.parseUnsignedNumber(2);
  // jshint bitwise: false
  return (high * Math.pow(2, 32)) + low;
};

/**
 * [parseUInt24 description]
 * @param  {[type]} parser [description]
 * @return {[type]}        [description]
 */
Utilities.parseUInt24 = function(parser) {
  var low = parser.parseUnsignedNumber(2);
  var high = parser.parseUnsignedNumber(1);
  // jshint bitwise: false
  return (high << 16) + low;
};


/**
 * Convert a 
 * @param  {[type]} code [description]
 * @return {[type]}      [description]
 */
Utilities.convertToMysqlType = function(code) {
  for(var name in Types) {
  	if(Types[name] == code){
  		return name;
  	}
  }
};

/**
 * [parseAnyInt description]
 * @param  {[type]} parser       [description]
 * @param  {[type]} column       [description]
 * @param  {[type]} columnSchema [description]
 * @return {[type]}              [description]
 */
Utilities.parseAnyInt = function(parser, column, columnSchema) {
  var result, int64, size;
  switch (column) {
    case Types.TINY:
      size = 1;
      result = parser.parseUnsignedNumber(size);
      break;
    case Types.SHORT:
      size = 2;
      result = parser.parseUnsignedNumber(size);
      break;
    case Types.INT24:
      size = 3;
      result = Utilities.parseUInt24(parser);
      break;
    case Types.LONG:
      size = 4;
      result = parser.parseUnsignedNumber(size);
      break;
    case Types.LONGLONG:
      size = 8;
      int64 = {};
      result = Utilities.parseUInt64.call(int64, parser);
      break;
  }

  if(columnSchema.COLUMN_TYPE.indexOf('unsigned') === -1){
    var length = size * 8;
    // Flip bits on negative signed integer
    if(!int64 && (result & (1 << (length - 1)))){
      result = ((result ^ (Math.pow(2, length) - 1)) * -1) - 1;
    }else if(int64 && (int64.high & (1 << 31))){
      // Javascript integers only support 2^53 not 2^64, must trim bits!
      // 64-53 = 11, 32-11 = 21, so grab first 21 bits of high word only
      var mask = Math.pow(2, 32) - 1;
      var high = Utilities.sliceBits(int64.high ^ mask, 0, 21);
      var low = int64.low ^ mask;
      result = ((high * Math.pow(2, 32)) * - 1) - Utilities.getUInt32Value(low) - 1;
    }
  }
  
  return result;
};

/**
 * [zeroPad description]
 * @param  {[type]} num  [description]
 * @param  {[type]} size [description]
 * @return {[type]}      [description]
 */
Utilities.zeroPad = function(num, size) {
  // Max 32 digits
  var s = "00000000000000000000000000000000" + num;
  return s.substr(s.length-size);
};

/**
 * [sliceBits description]
 * @param  {[type]} input [description]
 * @param  {[type]} start [description]
 * @param  {[type]} end   [description]
 * @return {[type]}       [description]
 */
Utilities.sliceBits = function(input, start, end){
  // ex: start: 10, end: 15 = "111110000000000"
  var match = (((1 << end) - 1) ^ ((1 << start) - 1));
  return (input & match) >> start;
};

/**
 * [parseIEEE754Float description]
 * @param  {[type]} high [description]
 * @param  {[type]} low  [description]
 * @return {[type]}      [description]
 * 
 * See information about IEEE-754 Floating point numbers:
 * http://www.h-schmidt.net/FloatConverter/IEEE754.html
 * http://babbage.cs.qc.cuny.edu/IEEE-754.old/64bit.html
 * Pass only high for 32-bit float, pass high and low for 64-bit double
 */
Utilities.parseIEEE754Float = function(high, low){
  var lastSignificantBit, sigFigs, expLeading;
  if(low !== undefined){
    // 64-bit: 1 sign, 11 exponent, 52 significand
    lastSignificantBit = 20;
    sigFigs = 52;
    expLeading = 1023; // 2^(11-1) - 1
  }else{
    // 32-bit: 1 sign, 8 exponent, 23 significand
    lastSignificantBit = 23;
    sigFigs = 23;
    expLeading = 127; // 2^(8-1) - 1
  }

  var sign            = (high & (1 << 31)) !== 0 ? -1 : 1;
  var exponent        = Utilities.sliceBits(high, lastSignificantBit, 31) - expLeading;
  var significandBits = Utilities.sliceBits(high, 0, lastSignificantBit);
  var significand     = 1; // Becomes value between 1, 2

  for(var i = 0; i < lastSignificantBit; i++){
    if(significandBits & (1 << i)){
      significand += 1 / (1 << (sigFigs - i));
    }
  }

  if(low !== undefined){
    for(var i = 0; i < 32; i++){
      if(low & (1 << i)){
        // Bitwise operators only work on up to 32 bits
        significand += 1 / Math.pow(2, sigFigs - i);
      }
    }
  }

  return sign * Math.pow(2, exponent) * significand;
};

/**
 * [getUInt32Value description]
 * @param  {[type]} input [description]
 * @return {[type]}       [description]
 */
Utilities.getUInt32Value = function(input){
  // Last bit is not sign, it is part of value!
  if(input & (1 << 31)) return Math.pow(2, 31) + (input & ((1 << 31) -1));
  else return input;
};

/**
 * [readInt24BE description]
 * @param  {[type]} buf      [description]
 * @param  {[type]} offset   [description]
 * @param  {[type]} noAssert [description]
 * @return {[type]}          [description]
 */
Utilities.readInt24BE = function(buf, offset, noAssert) {
  return (buf.readInt8(offset, noAssert) << 16) +
          buf.readUInt16BE(offset + 1, noAssert);
};

/**
 * [readIntBE description]
 * @param  {[type]} buf      [description]
 * @param  {[type]} offset   [description]
 * @param  {[type]} length   [description]
 * @param  {[type]} noAssert [description]
 * @return {[type]}          [description]
 */
Utilities.readIntBE = function(buf, offset, length, noAssert){
  switch(length){
    case 1: return buf.readInt8(offset, noAssert);
    case 2: return buf.readInt16BE(offset, noAssert);
    case 3: return Utilities.readInt24BE(buf, offset, noAssert);
    case 4: return buf.readInt32BE(offset, noAssert);
  }
};


// Adapted from jeremycole's Ruby implementation:
// https://github.com/jeremycole/mysql_binlog/blob/master/lib/mysql_binlog/binlog_field_parser.rb
// Some more information about DECIMAL types:
// http://dev.mysql.com/doc/refman/5.5/en/precision-math-decimal-characteristics.html
Utilities.parseNewDecimal = function(parser, column) {
  // Constants of format
  var digitsPerInteger = 9;
  var bytesPerInteger = 4;
  var compressedBytes = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4];

  var scale = columnSchema.decimals;
  var integral = columnSchema.precision - scale;
  var uncompIntegral = Math.floor(integral / digitsPerInteger);
  var uncompFractional = Math.floor(scale / digitsPerInteger);
  var compIntegral = integral - (uncompIntegral * digitsPerInteger);
  var compFractional = scale - (uncompFractional * digitsPerInteger);

  // Grab buffer portion
  var size = (uncompIntegral * 4) + compressedBytes[compIntegral] +
             (uncompFractional * 4) + compressedBytes[compFractional];
  var buffer = parser._buffer.slice(parser._offset, parser._offset + size);
  parser._offset += size; // Move binlog parser position forward

  var str, mask, pos = 0;
  var isPositive = (buffer.readInt8(0) & (1 << 7)) === 128;
  buffer.writeInt8(buffer.readInt8(0) ^ (1 << 7), 0, true);
  if(isPositive){
    // Positive number
    str = '';
    mask = 0;
  }else{
    // Negative number
    str = '-';
    mask = -1;
  }

  // Build integer digits
  var compIntegralSize = compressedBytes[compIntegral];
  if(compIntegralSize > 0){
    str += (Utilities.readIntBE(buffer, 0, compIntegralSize) ^ mask).toString(10);
    pos += compIntegralSize;
  }

  for(var i = 0; i < uncompIntegral; i++){
    str += (buffer.readInt32BE(pos) ^ mask).toString(10);
    pos += 4;
  }

  str += '.'; // Proceeding bytes are fractional digits

  for(var i = 0; i < uncompFractional; i++){
    str += (buffer.readInt32BE(pos) ^ mask).toString(10);
    pos += 4;
  }

  var compFractionalSize = compressedBytes[compFractional];
  if(compFractionalSize > 0){
    str += (Utilities.readIntBE(buffer, pos, compFractionalSize) ^ mask).toString(10);
  }

  return parseFloat(str);
};

/**
 * [parseGeometryValue description]
 * @param  {[type]} buffer [description]
 * @return {[type]}        [description]
 */
Utilities.parseGeometryValue = function(buffer){
  var offset = 4;

  if (buffer === null || !buffer.length) {
    return null;
  }

  function parseGeometry() {
    var result = null;
    var byteOrder = buffer.readUInt8(offset); offset += 1;
    var wkbType = byteOrder? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset); offset += 4;
    switch(wkbType) {
      case 1: // WKBPoint
        var x = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
        var y = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
        result = {x: x, y: y};
        break;
      case 2: // WKBLineString
        var numPoints = byteOrder? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset); offset += 4;
        result = [];
        for(var i=numPoints;i>0;i--) {
          var x = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
          var y = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
          result.push({x: x, y: y});
        }
        break;
      case 3: // WKBPolygon
        var numRings = byteOrder? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset); offset += 4;
        result = [];
        for(var i=numRings;i>0;i--) {
          var numPoints = byteOrder? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset); offset += 4;
          var line = [];
          for(var j=numPoints;j>0;j--) {
            var x = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
            var y = byteOrder? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset); offset += 8;
            line.push({x: x, y: y});
          }
          result.push(line);
        }
        break;
      case 4: // WKBMultiPoint
      case 5: // WKBMultiLineString
      case 6: // WKBMultiPolygon
      case 7: // WKBGeometryCollection
        var num = byteOrder? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset); offset += 4;
        var result = [];
        for(var i=num;i>0;i--) {
          result.push(parseGeometry());
        }
        break;
    }
    return result;
  }
  return parseGeometry();
};

/**
 * [parseBytesArray description]
 * @param  {[type]} parser [description]
 * @param  {[type]} size   [description]
 * @return {[type]}        [description]
 */
Utilities.parseBytesArray = function(parser, size) {
  var result = new Array(size);
  for (var i = 0; i < size; i++) {
    result[i] = parser.parseUnsignedNumber(1);
  }
  return result;
};

/**
 * [readTemporalFraction description]
 * @param  {[type]} parser            [description]
 * @param  {[type]} fractionPrecision [description]
 * @return {[type]}                   [description]
 */
Utilities.readTemporalFraction =  function(parser, fractionPrecision) {
  if(!fractionPrecision) return false;
  var fractionSize = Math.ceil(fractionPrecision / 2);
  var fraction = Utilities.readIntBE(parser._buffer, parser._offset, fractionSize);
  parser._offset += fractionSize;
  if(fractionPrecision % 2 !== 0) fraction /= 10; // Not using full space
  if(fraction < 0) fraction *= -1; // Negative time, fraction not negative

  var milliseconds;
  if(fractionPrecision > 3){
    milliseconds = Math.floor(fraction / Math.pow(10, fractionPrecision - 3));
  }else if(fractionPrecision < 3){
    milliseconds = fraction * Math.pow(10, 3 - fractionPrecision);
  }else{
    milliseconds = fraction;
  }

  return {
    value: fraction,
    precision: fractionPrecision,
    milliseconds: milliseconds
  };
};

/**
 * [readMysqlValue description]
 * @param  {[type]} parser       [description]
 * @param  {[type]} column       [description]
 * @param  {[type]} columnSchema [description]
 * @return {[type]}              [description]
 */
Utilities.readMysqlValue = function(parser, column, columnSchema) {
  var result;
  // jshint indent: false
  switch (column) {
    case Types.TINY:
    case Types.SHORT:
    case Types.INT24:
    case Types.LONG:
    case Types.LONGLONG:
      result = Utilities.parseAnyInt.apply(this, arguments);
      break;
    case Types.FLOAT:
      // 32-bit IEEE-754
      var raw = parser.parseUnsignedNumber(4);
      result = Utilities.parseIEEE754Float(raw);
      break;
    case Types.DOUBLE:
      // 64-bit IEEE-754
      var low = parser.parseUnsignedNumber(4);
      var high = parser.parseUnsignedNumber(4);
      result = Utilities.parseIEEE754Float(high, low);
      break;
    case Types.NEWDECIMAL:
      result = Utilities.parseNewDecimal(parser, column);
      break;
    case Types.SET:
      var high, low;
      if(columnSchema.size === 8){
        low = parser.parseUnsignedNumber(4);
        high = parser.parseUnsignedNumber(4);
      }else{
        low = parser.parseUnsignedNumber(columnSchema.size);
      }

      var choices = Utilities.parseSetEnumTypeDef(columnSchema.COLUMN_TYPE);
      result = '';
      for(var i = 0; low >= Math.pow(2, i); i++){
        if(low & Math.pow(2, i)) result += choices[i] + ',';
      }
      if(high){
        for(var i = 0; high >= Math.pow(2, i); i++){
          if(high & Math.pow(2, i)) result += choices[i + 32] + ',';
        }
      }
      if(result.length > 0) result = result.substr(0, result.length - 1);
      break;
    case Types.ENUM:
      var raw = parser.parseUnsignedNumber(columnSchema.size);
      var choices = parseSetEnumTypeDef(columnSchema.COLUMN_TYPE);
      result = choices[raw - 1];
      break;
    case Types.VAR_STRING:
      // Never used?
      result = parser.parseLengthCodedString();
      break;
    case Types.VARCHAR:
    case Types.STRING:
      var prefixSize = columnSchema['max_length'] > 255 ? 2 : 1;
      var size = parser.parseUnsignedNumber(prefixSize);
      var def = columnSchema.COLUMN_TYPE;
      var defPrefix = def.substr(0, 6);
      if(defPrefix === 'binary'){
        result = new Buffer(parseInt(def.substr(7, def.length - 2), 10));
        result.fill(0);
        parser.parseBuffer(size).copy(result);
      }else if(defPrefix === 'varbin'){
        result = parser.parseBuffer(size);
      }else{
        result = parser.parseString(size);
      }
      break;
    case Types.TINY_BLOB:
    case Types.MEDIUM_BLOB:
    case Types.LONG_BLOB:
    case Types.BLOB:
      var lengthSize = columnSchema['length_size'];
      result = parser.parseString(
        parser.parseUnsignedNumber(lengthSize));
      break;
    case Types.GEOMETRY:
      var lengthSize = columnSchema['length_size'];
      var size = parser.parseUnsignedNumber(lengthSize);
      var buffer = parser.parseBuffer(size);
      result = Utilities.parseGeometryValue(buffer);
      break;
    case Types.DATE:
      var raw = Utilities.parseUInt24(parser);
      result = new Date(
        Utilities.sliceBits(raw, 9, 24),     // year
        Utilities.sliceBits(raw, 5, 9) - 1,  // month
        Utilities.sliceBits(raw, 0, 5)       // day
      );
      break;
    case Types.TIME:
      var raw = Utilities.parseUInt24(parser);

      var isNegative = (raw & (1 << 23)) !== 0;
      if(isNegative) raw = raw ^ ((1 << 24) - 1); // flip all bits

      var hour = Math.floor(raw / 10000);
      var minute = Math.floor((raw % 10000) / 100);
      var second = raw % 100;
      if(isNegative) second += 1;

      result = (isNegative ? '-' : '') +
               Utilities.zeroPad(hour, hour > 99 ? 3 : 2) + ':' +
               Utilities.zeroPad(minute, 2) + ':' +
               Utilities.zeroPad(second, 2);
      break;
    case Types.TIME2:
      var raw = Utilities.readIntBE(parser._buffer, parser._offset, 3);
      parser._offset += 3;
      var fraction = Utilities.readTemporalFraction(parser, columnSchema.decimals);

      var isNegative = (raw & (1 << 23)) === 0;
      if(isNegative) raw = raw ^ ((1 << 24) - 1); // flip all bits

      var hour = Utilities.sliceBits(raw, 12, 22);
      var minute = Utilities.sliceBits(raw, 6, 12);
      var second = Utilities.liceBits(raw, 0, 6);

      if(isNegative && (fraction === false || fraction.value === 0)){
        second++;
      }

      result = (isNegative ? '-' : '') +
               Utilities.zeroPad(hour, hour > 99 ? 3 : 2) + ':' +
               Utilities.zeroPad(minute, 2) + ':' +
               Utilities.zeroPad(second, 2);

      if(fraction !== false){
        result += '.' + Utilities.zeroPad(fraction.value, fraction.precision);
      }
      break;
    case Types.DATETIME:
      var raw = Utilities.parseUInt64(parser);
      var date = Math.floor(raw / 1000000);
      var time = raw % 1000000;
      result = new Date(
        Math.floor(date / 10000),             // year
        Math.floor((date % 10000) / 100) - 1, // month
        date % 100,                           // day
        Math.floor(time / 10000),             // hour
        Math.floor((time % 10000) / 100),     // minutes
        time % 100                            // seconds
      );
      break;
    case Types.DATETIME2:
      // Overlapping high-low to get all data in 32-bit numbers
      var rawHigh = Utilities.readIntBE(parser._buffer, parser._offset, 4);
      var rawLow = Utilities.readIntBE(parser._buffer, parser._offset + 1, 4);
      parser._offset += 5;
      var fraction = Utilities.readTemporalFraction(parser, columnSchema.decimals);

      var yearMonth = Utilities.sliceBits(rawHigh, 14, 31);
      result = new Date(
        Math.floor(yearMonth / 13), // year
        (yearMonth % 13) - 1,       // month
        Utilities.sliceBits(rawLow, 17, 22),  // day
        Utilities.sliceBits(rawLow, 12, 17),  // hour
        Utilities.sliceBits(rawLow, 6, 12),   // minutes
        Utilities.liceBits(rawLow, 0, 6),    // seconds
        fraction !== false ? fraction.milliseconds : 0
      );
      break;
    case Types.TIMESTAMP:
      var raw = parser.parseUnsignedNumber(4);
      result = new Date(raw * 1000);
      break;
    case Types.TIMESTAMP2:
      var raw = Utilities.readIntBE(parser._buffer, parser._offset, 4);
      parser._offset += 4;
      var fraction = Utilities.readTemporalFraction(parser, columnSchema.decimals);
      var milliseconds = fraction !== false ? fraction.milliseconds : 0;
      result = new Date((raw * 1000) + milliseconds);
      break;
    case Types.YEAR:
      var raw = parser.parseUnsignedNumber(1);
      result = raw + 1900;
      break;
    case Types.BIT:
      var size = Math.floor((columnSchema.bits + 7) / 8);
      result = parser._buffer.slice(parser._offset, parser._offset + size);
      parser._offset += size; // Move binlog parser position forward
      break;
    case Types.NULL: // Uses nullBitmap in lib/rows_event :: readRow
    case Types.DECIMAL: // Deprecated in MySQL > 5.0.3
    case Types.NEWDATE: // Not used
    default:
      throw new Error('Unsupported type: ' + convertToMysqlType(column.type));
  }
  return result;
}