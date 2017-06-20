const router = require("express").Router();

router.use("/register", require("./register"));
router.use("/streams", require("./streams"));
router.use("/status", require("./status"));
router.use("/users", require("./users"));

router.get("/me", (req, res) => {
	res.status(200).sign({
		success: true,
		user: req.user
	});
});

module.exports = router;