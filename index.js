const config = require("config");
const express = require("express");
const middleware = require("./lib/middleware");
const discovery = require("./lib/discovery");
const uuid = require("uuid");
const health = require("./lib/health");

const fs = require("fs");
const path = require("path");

// Initialize connections (database etc)
require("./lib/db");
require("./lib/redis");

const app = express();

app.use(health.middleware.timings);
app.use(middleware.cors);
app.use((req, res, next) => {
	req.id = uuid();
	next();
});
app.use(require("morgan")(config.get("http.log")));
app.use(require("body-parser").text({
	type: "application/json"
}));
app.use(middleware.sign);
app.use(middleware.user);
app.use(middleware.verify);

app.get("/", (req, res) => {
	res.sign({
		test: "Test response"
	});
});

app.post("/", (req, res) => {
	res.sign(req.payload);
});

app.use(require("./routes"));

app.listen(config.get("http.port"), (err) => {
	if(err) {
		console.error("[Express/Listen]", err);
		return;
	}

	console.log("Listening on port "+config.get("http.port"));
});