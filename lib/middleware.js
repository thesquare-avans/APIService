const config = require("config");
const crypto = require("crypto");
const db = require("./db");
const redis = require("./redis");

const cryptoInfo = {
	privateKeyPem: Buffer.from(config.get("crypto.private"), "base64"),
	publicKeyPem: Buffer.from(config.get("crypto.public"), "base64")
};

function cors(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS");
	res.setHeader("Access-Control-Max-Age", 1000);
	res.setHeader("Access-Control-Allow-Headers", "x-publickey, origin, x-csrftoken, content-type, accept");

	if(req.method == "OPTIONS") {
		res.status(200).end();
		return;
	}

	next();
}
module.exports.cors = cors;

function user(req, res, next) {
	if(!req.headers['x-publickey']) {
		return res.status(401).sign({
			success: false,
			error: {
				code: "publicKeyMissing"
			}
		});
	}

	if(req.url == "/register") {
		return next();
	}

	var hash = crypto.createHash("sha256");
	hash.update(req.headers['x-publickey'], "utf8");
	var digest = hash.digest("base64");

	redis.get("user:"+digest, (err, result) => {
		if(err) {
			console.error("[Middleware/User]", err);

			return res.status(500).sign({
				success: false,
				error: {
					code: "unexpectedError"
				}
			});
		}

		if(result) {
			req.user = JSON.parse(result);
			return next();
		}

		db.query(db.escape`
			SELECT
				*
			FROM
				public.user
			WHERE
				"keyHash" = ${digest}
		`)
		.then((result) => {
			if(result.rows.length == 1) {
				req.user = result.rows[0];
				redis.set("user:"+digest, JSON.stringify(result.rows[0]));
				return next();
			}

			res.status(401).sign({
				success: false,
				error: {
					code: "userNotFound"
				}
			});
		})
		.catch((err) => {
			console.error("[Middleware/User]", err);

			res.status(500).sign({
				success: false,
				error: {
					code: "unexpectedError"
				}
			});
		});
	});
}
module.exports.user = user;

function verify(req, res, next) {
	if(req.method == "GET") {
		return next();
	}

	if(req.headers['content-type'].indexOf("application/json") == -1) {
		return res.status(400).sign({
			success: false,
			error: {
				"code": "invalidContentType"
			}
		});
	}

	if(!req.body) {
		return res.status(400).sign({
			success: false,
			error: {
				"code": "missingBody"
			}
		});
	}

	if(!req.body.hasOwnProperty("payload") || !req.body.hasOwnProperty("signature")) {
		return res.status(400).sign({
			success: false,
			error: {
				"code": "missingFields"
			}
		});
	}

	next();
}
module.exports.verify = verify;

function sign(req, res, next) {
	var _send = res.send;

	res.sign = function (data) {
		if(typeof data != "object") {
			throw new Error("Only JSON responses are supported");
		}

		var sign = crypto.createSign("sha256");

		var textData = JSON.stringify(data);

		sign.update(textData, "utf8");

		_send.call(this, {
			payload: textData,
			signature: sign.sign(cryptoInfo.privateKeyPem).toString("hex")
		});
	};

	next();
}
module.exports.sign = sign;

function checkUser(req, res, next) {

}
module.exports.checkUser = checkUser;