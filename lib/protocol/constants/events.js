/**
 * Lookup event code by name
 */
exports.UNKNOWN_EVENT             = 0x00;
exports.START_EVENT_V3            = 0x01;
exports.QUERY_EVENT               = 0x02;
exports.STOP_EVENT                = 0x03;
exports.ROTATE_EVENT              = 0x04;
exports.INTVAR_EVENT              = 0x05;
exports.LOAD_EVENT                = 0x06;
exports.SLAVE_EVENT               = 0x07;
exports.CREATE_FILE_EVENT         = 0x08;
exports.APPEND_BLOCK_EVENT        = 0x09;
exports.EXEC_LOAD_EVENT           = 0x0a;
exports.DELETE_FILE_EVENT         = 0x0b;
exports.NEW_LOAD_EVENT            = 0x0c;
exports.RAND_EVENT                = 0x0d;
exports.USER_VAR_EVENT            = 0x0e;
exports.FORMAT_DESCRIPTION_EVENT  = 0x0f;
exports.XID_EVENT                 = 0x10;
exports.BEGIN_LOAD_QUERY_EVENT    = 0x11;
exports.EXECUTE_LOAD_QUERY_EVENT  = 0x12;
exports.TABLE_MAP_EVENT           = 0x13;
exports.PRE_GA_DELETE_ROWS_EVENT  = 0x14;
exports.PRE_GA_UPDATE_ROWS_EVENT  = 0x15;
exports.PRE_GA_WRITE_ROWS_EVENT   = 0x16;
exports.DELETE_ROWS_EVENT         = 0x19;
exports.UPDATE_ROWS_EVENT         = 0x18;
exports.WRITE_ROWS_EVENT          = 0x17;
exports.INCIDENT_EVENT            = 0x1a;
exports.HEARTBEAT_LOG_EVENT       = 0x1b;

/**
 * Lookup event name by code
 */
exports[0x00] = 'UNKNOWN_EVENT';
exports[0x01] = 'START_EVENT_V3';
exports[0x02] = 'QUERY_EVENT';
exports[0x03] = 'STOP_EVENT';
exports[0x04] = 'ROTATE_EVENT';
exports[0x05] = 'INTVAR_EVENT';
exports[0x06] = 'LOAD_EVENT';
exports[0x07] = 'SLAVE_EVENT';
exports[0x08] = 'CREATE_FILE_EVENT';
exports[0x09] = 'APPEND_BLOCK_EVENT';
exports[0x0a] = 'EXEC_LOAD_EVENT';
exports[0x0b] = 'DELETE_FILE_EVENT';
exports[0x0c] = 'NEW_LOAD_EVENT';
exports[0x0d] = 'RAND_EVENT';
exports[0x0e] = 'USER_VAR_EVENT';
exports[0x0f] = 'FORMAT_DESCRIPTION_EVENT';
exports[0x10] = 'XID_EVENT';
exports[0x11] = 'BEGIN_LOAD_QUERY_EVENT';
exports[0x12] = 'EXECUTE_LOAD_QUERY_EVENT';
exports[0x13] = 'TABLE_MAP_EVENT';
exports[0x14] = 'PRE_GA_DELETE_ROWS_EVENT';
exports[0x15] = 'PRE_GA_UPDATE_ROWS_EVENT';
exports[0x16] = 'PRE_GA_WRITE_ROWS_EVENT';
exports[0x19] = 'DELETE_ROWS_EVENT';
exports[0x18] = 'UPDATE_ROWS_EVENT';
exports[0x17] = 'WRITE_ROWS_EVENT';
exports[0x1a] = 'INCIDENT_EVENT';
exports[0x1b] = 'HEARTBEAT_LOG_EVENT';