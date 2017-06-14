const router = require("express").Router();
const discovery = require("../lib/discovery");

var lastCheck = new Date().getTime() - 60000;
var lastStatus = {};

router.get("/", (req, res) => {
	if(lastCheck + 60000 < new Date().getTime()) {
		discovery.request(req.id, "status", {})
		.then((data) => {
			res.sign(data);
			lastStatus = data;
			lastCheck = new Date().getTime()
		});
	}else{
		res.sign(lastStatus);
	}
});

module.exports = router;