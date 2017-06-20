const config = require("config");
const pg = require("pg");

const pool = new pg.Pool(config.get("db"));

module.exports.query = function (sql) {
	return pool.query(sql);
};

module.exports.escape = require("sql-template-strings");

module.exports.isUuid = function (uuid) {
	return typeof uuid == "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}