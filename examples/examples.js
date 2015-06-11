/**
 * Require the binlog
 */
var BinLog  = require("../");

var binLog = new BinLog({
	"host": "127.0.0.1",
	"user": "zongji",
	"password": "zongji",
	// debug: true
});

/**
 * Use specific event parsers
 */
binLog.use(BinLog.Packets.Rotate);
binLog.use(BinLog.Packets.Format);
binLog.use(BinLog.Packets.Query);
// binLog.use(BinLog.Packets.Xid);
// binLog.use(BinLog.Packets.Stop);
// binLog.use(BinLog.Packets.TableMap);
// binLog.use(BinLog.Packets.UpdateRows);

binLog.start();