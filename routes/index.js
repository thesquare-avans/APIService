const router = require("express").Router();
const crypto = require("crypto");
const db = require("../lib/db");

router.use("/streams", require("./streams"));
router.use("/status", require("./status"));

router.get("/me", (req, res) => {
	res.status(200).sign({
		success: true,
		user: req.user
	});
});

router.post("/register", (req, res) => {
	if(req.user) {
		return res.status(409).sign({
			success: false,
			error: {
				code: "alreadyRegistered"
			}
		});
	}

	var hash = crypto.createHash("sha256");
	hash.update(req.headers['x-publickey'], "utf8");

	db.query(db.escape`
		INSERT INTO
			public.user (
				"keyHash",
				"name"
			)
		VALUES
			(
				${hash.digest("base64")},
				${req.payload.name}
			)
		RETURNING *
	`)
	.then((result) => {
		return res.status(201).sign({
			success: true,
			user: result.rows[0]
		});
	})
	.catch((err) => {
		console.error("[Routes/Register]", err);

		res.status(500).sign({
			success: false,
			error: {
				code: "unexpectedError"
			}
		});
	});
});

router.post("/users", (req, res) => {

});

module.exports = router;