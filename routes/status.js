const router = require("express").Router();
const discovery = require("../lib/discovery");

var lastCheck = new Date().getTime() - 60000;
var lastStatus = {};

router.get("/", (req, res) => {
	if(process.env.NODE_ENV == "development" || lastCheck + 60000 < new Date().getTime()) {
		discovery.send("status", {}, true)
		.then((data) => {
			res.sign(data);
			lastStatus = data;
			lastCheck = new Date().getTime()
		})
		.catch((err) => {
			console.error("[Discovery/Status]", err);
			res.sign({
				success: false,
				error: {
					code: "unknownError"
				}
			})
		});
	}else{
		res.sign(lastStatus);
	}
});

module.exports = router;