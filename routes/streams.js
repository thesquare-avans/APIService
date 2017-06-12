const router = require("express").Router();
const streams = require("../lib/streams");

router.get("/", (req, res) => {
	streams.getAll()
	.then((allStreams) => {
		res.sign({
			success: true,
			amount: allStreams.length,
			streams: allStreams
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

router.post("/", (req, res) => {
	streams.getByOwner(req.user.id)
	.then((stream) => {
		if(stream) {
			return res.status(403).sign({
				success: false,
				streamId: stream.id,
				error: {
					code: "streams#alreadyStreaming"
				}
			});
		}

		if(!req.payload.title) {
			return res.status(400).sign({
				success: false,
				error: {
					code: "streams#titleMissing"
				}
			});
		}

		if(typeof req.payload.title != "string") {
			return res.status(400).sign({
				success: false,
				error: {
					code: "streams#titleInvalid"
				}
			});
		}

		var data = {
			title: req.payload.title,
			owner: req.user
		};

		return streams.create(data)
		.then((stream) => {
			res.status(201).sign({
				success: true,
				stream: stream
			});
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

router.get("/:streamId", (req, res) => {
	if(typeof req.params.streamId != "string" || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.streamId) == false) {
		return res.status(400).sign({
			success: false,
			error: {
				code: "invalidParameter"
			}
		});
	}

	streams.get(req.params.streamId)
	.then((stream) => {
		if(!stream) {
			return res.status(404).sign({
				success: false,
				error: {
					code: "resourceNotFound"
				}
			});	
		}

		res.sign({
			success: true,
			stream: stream
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

router.put("/:streamId", (req, res) => {
	if(typeof req.params.streamId != "string" || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.streamId) == false) {
		return res.status(400).sign({
			success: false,
			error: {
				code: "invalidParameter"
			}
		});
	}

	streams.get(req.params.streamId)
	.then((stream) => {
		if(!stream) {
			return res.status(404).sign({
				success: false,
				error: {
					code: "resourceNotFound"
				}
			});	
		}

		if(!stream.ownerId != req.user.id) {
			return res.status(403).sign({
				success: false,
				error: {
					code: "streams#notStreamOwner"
				}
			});
		}

		if(!req.payload.title) {
			return res.status(400).sign({
				success: false,
				error: {
					code: "streams#titleMissing"
				}
			});
		}

		if(typeof req.payload.title != "string") {
			return res.status(400).sign({
				success: false,
				error: {
					code: "streams#titleInvalid"
				}
			});
		}

		return streams.update(req.params.streamId, {
			title: req.payload.title
		})
		.then((stream) => {
			res.sign({
				success: true,
				stream: stream
			});
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