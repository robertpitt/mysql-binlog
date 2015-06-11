/**
 * Require the binlog
 */
var BinLog  = require("../");

var binLog = new BinLog({
	"host": "127.0.0.1",
	"user": "zongji",
	"password": "zongji"
});

/**
 * Use specific event parsers
 */
binLog.use(BinLog.Parsers.Rotate);

binLog.on("rotate", f)

binLog.start();