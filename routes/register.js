const router = require("express").Router();
const users = require("../lib/users");

router.post("/", (req, res) => {
	if(req.user) {
		return res.status(409).sign({
			success: false,
			error: {
				code: "alreadyRegistered"
			}
		});
	}

	if(!req.payload.hasOwnProperty("name")) {
		return res.status(400).sign({
			success: false,
			error: {
				code: "nameMissing"
			}
		});
	}

	if(typeof req.payload.name != "string") {
		return res.status(400).sign({
			success: false,
			error: {
				code: "nameInvalid"
			}
		});
	}

	var hash = crypto.createHash("sha256");
	hash.update(req.headers['x-publickey'], "utf8");

	var data = {
		keyHash: hash.digest("base64"),
		name: req.payload.name,
		publicKey: req.headers['x-publickey']
	};

	users.create(data)
	.then((user) => {
		res.status(201).sign({
			success: true,
			user: user
		});
	})
	.catch((err) => {
		res.status(500).sign({
			success: false,
			error: {
				code: "unexpectedError"
			}
		});
	});
});

module.exports = router;