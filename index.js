const config = require("config");
const express = require("express");
const middleware = require("./lib/middleware");

const fs = require("fs");
const path = require("path");

// Initialize connections (database etc)
require("./lib/db");
require("./lib/redis");

const app = express();

app.use(middleware.cors);
app.use(require("morgan")(config.get("http.log")));
app.use(require("body-parser").text({
	type: "application/json"
}));
app.use(middleware.sign);
app.use(middleware.user);
app.use(middleware.verify);

/**
 * @apiDefine unexpectedError Unexpected error
 * @apiError unexpectedError Error occurred unexpectedly and is not handled properly 
 */

/**
 * @apiDefine publicKeyMissing Public key missing
 * @apiError publicKeyMissing No header <code>X-PublicKey</code> was sent in the request
 */

/**
 * @apiDefine userNotFound Use not found
 * @apiError userNotFound There is no user registered with this public key. Register first using <code>/v1/register</code>
 */

/**
 * @apiDefine invalidContentType Invalid Content-Type header
 * @apiError invalidContentType An invalid <code>Content-Type</code> header has been sent. Only <code>application/json</code> is supported
 */

/**
 * @apiDefine missingBody Missing body
 * @apiError missingBody No body has been sent to fulfil this request
 */

/**
 * @apiDefine missingFields Missing fields
 * @apiError missingFields Not all of the required fields have been sent to fulfil this request
 */

/**
 * @apiDefine GETRequest
 * @apiUse unexpectedError
 * @apiUse publicKeyMissing
 * @apiUse userNotFound
 */

/**
 * @apiDefine POSTRequest
 * @apiUse unexpectedError
 * @apiUse publicKeyMissing
 * @apiUse userNotFound
 * @apiUse invalidContentType
 * @apiUse missingBody
 * @apiUse missingFields
 */

/**
 * @api {get} /v1/ /v1/ Get a sample API response with fixed data
 * @apiName GetSampleResponse
 * @apiVersion 1.0.0
 * @apiGroup General
 *
 * @apiSuccess {String} test A test string
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "test": "Test response"
 *     }
 *
 * @apiUse GETRequest
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401
 *     {
 *       "success": "false",
 *       "error": {
 *           "code": "publicKeyMissing"	
 *       }
 *     }
 */
app.get("/", (req, res) => {
	res.sign({
		test: "Test response"
	});
});

/**
 * @api {post} /v1/ /v1/ Echo all responses
 * @apiName PostSampleResponse
 * @apiVersion 1.0.0
 * @apiGroup General
 *
 * @apiSuccess {Object} object Returns a JSON object with all sent data
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       // The data you sent
 *     }
 *
 * @apiUse POSTRequest
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401
 *     {
 *       "success": "false",
 *       "error": {
 *           "code": "publicKeyMissing"	
 *       }
 *     }
 */
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