const config = require("config");
const express = require("express");
const middleware = require("./lib/middleware");

const fs = require("fs");
const path = require("path");

// Initialize connections (database etc)
require("./lib/db");
require("./lib/redis");

const app = express();

app.use(require("morgan")(config.get("http.log")));
app.use(require("body-parser").json());
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	next();
});
app.use(middleware.sign);
app.use(middleware.verify);

app.get("/", (req, res) => {
	res.sign({
		test: [
			"jens z'n moeder"
		]
	});
});

app.listen(config.get("http.port"), (err) => {
	if(err) {
		console.error("[Express/Listen]", err);
		return;
	}

	console.log("Listening on port "+config.get("http.port"));
});