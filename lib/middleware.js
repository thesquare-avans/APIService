const config = require("config");
const crypto = require("crypto");
const md5 = require("md5");

const cryptoInfo = {
	privateKeyPem: Buffer.from(config.get("crypto.private"), "base64"),
	publicKeyPem: Buffer.from(config.get("crypto.public"), "base64")
};

function verify(req, res, next) {
	next();
}
module.exports.verify = verify;

function sign(req, res, next) {
	var _send = res.send;

	res.sign = function (data) {
		if(typeof data != "object") {
			throw new Error("Only JSON responses are supported");
		}

		var hash = md5(JSON.stringify(data));

		var encryptedData = crypto.privateEncrypt(cryptoInfo.privateKeyPem, Buffer.from(hash, "utf8"));

		_send.call(this, {
			payload: data,
			hash: encryptedData.toString("base64")
		});
	};

	next();
}
module.exports.sign = sign;