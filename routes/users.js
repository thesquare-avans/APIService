const router = require("express").Router();
const db = require("../lib/db");

router.get("/:userid", (req, res) => {
	db.query(db.escape`
		SELECT
			*
		FROM
			public.user
		WHERE
			id = ${req.params.userid}
	`)
	.then((result) => {
		if(result.rows.length == 1) {
			return res.sign({
				success: true,
				user: result.rows[0]
			});
		}

		return res.status(404).sign({
			success: false,
			error: {
				code: "userNotFound"
			}
		});
	})
	.catch((err) => {
		console.error("[Users/Single]", err);

		res.status(500).sign({
			success: false,
			error: {
				code: "unexpectedError"
			}
		});
	});
});

module.exports = router;