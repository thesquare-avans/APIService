const router = require("express").Router();
const streams = require("../lib/streams");
const discovery = require("../lib/discovery");
const users = require("../lib/users");

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
			return discovery.send("start", {
				streamId: stream.id,
				streamer: req.user,
				title: stream.title
			}, true, 10000)
			.then((response) => {
				if(response.success) {
					return streams.update(stream.id, {
						title: stream.title,
						streamingServer: response.data.streaming,
						chatServer: response.data.chat
					})
					.then((stream) => {
						return res.status(201).sign({
							success: true,
							stream: stream
						});
					});	
				}

				streams.remove(stream.id);

				return res.status(500).sign({
					success: false,
					error: {
						code: response.error.code
					}
				});
			})
			.catch((err) => {
				console.error("[Discovery/Start]", err);
				res.status(500).sign({
					success: false,
					error: {
						code: "unknownError"
					}
				})
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

		if(stream.ownerId != req.user.id) {
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

router.delete("/:streamId", (req, res) => {
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

		if(stream.ownerId != req.user.id) {
			return res.status(403).sign({
				success: false,
				error: {
					code: "streams#notStreamOwner"
				}
			});
		}

		return discovery.send("stop", {
			streamId: stream.id,
			chatServer: {
				type: "chat",
				id: stream.chatServer.id
			},
			streamingServer: {
				type: "streaming",
				id: stream.streamingServer.id
			},
			reason: "manuallyStopped"
		}, true, 10000)
		.then((response) => {
			if(response.success) {
				var satoshi = stream.satoshi;
				if(response.streamingServer && response.streamingServer.satoshi) {
					var satoshiResponse = parseInt(response.streamingServer.satoshi);
					if(!isNaN(satoshiResponse)) {
						satoshi = satoshiResponse;
					}
				}

				return users.updateSatoshi(req.user.id, satoshi)
				.then(() => {
					return streams.remove(stream.id)
				})
				.then(() => {
					return res.status(200).sign({
						success: true,
						chatServer: response.chatServer,
						streamingServer: response.streamingServer
					});
				});
			}

			return res.status(500).sign({
				success: false,
				error: {
					code: response.error.code
				}
			});
		})
		.catch((err) => {
			console.error("[Discovery/Stop]", err);
			res.status(500).sign({
				success: false,
				error: {
					code: "unknownError"
				}
			})
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