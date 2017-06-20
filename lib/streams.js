const db = require("./db");
const discovery = require("./discovery");
const users = require("./users");

function getAll() {
	return db.query(db.escape`
		SELECT
			*
		FROM
			stream
	`)
	.then((result) => {
		return Promise.resolve(result.rows);
	})
	.catch((err) => {
		console.error("[Streams/GetAll]", err);

		return Promise.reject(err);
	});
}
module.exports.getAll = getAll;

function get(id) {
	if(!db.isUuid(id)) {
		return Promise.resolve({
			status: 400,
			data: {
				success: false,
				error: {
					code: "invalidParameter"
				}
			}
		});
	}

	return db.query(db.escape`
		SELECT
			*
		FROM
			stream
		WHERE
			id = ${id}
	`)
	.then((result) => {
		if(result.rows.length == 1) {
			return Promise.resolve({
				status: 200,
				data: {
					success: true,
					stream: result.rows[0]
				}
			});
		}

		return Promise.resolve({
			status: 404,
			data: {
				success: false,
				error: {
					code: "resourceNotFound"
				}
			}
		});
	})
	.catch((err) => {
		console.error("[Streams/Get]", err);

		return Promise.reject(err);
	});
}
module.exports.get = get;

function getByStreamer(id) {
	return db.query(db.escape`
		SELECT
			*
		FROM
			stream
		WHERE
			"streamerId" = ${id}
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Streams/GetByStreamer]", err);

		return Promise.reject(err);
	});
}
module.exports.getByStreamer = getByStreamer;

function create(data) {
	return getByStreamer(data.streamer.id)
	.then((stream) => {
		if(stream) {
			return Promise.resolve({
				status: 403,
				data: {
					success: false,
					streamId: stream.id,
					error: {
						code: "alreadyStreaming"
					}
				}
			});
		}

		if(!data.title) {
			return Promise.resolve({
				status: 400,
				data: {
					success: false,
					error: {
						code: "titleMissing"
					}
				}
			});
		}

		if(typeof data.title != "string") {
			return Promise.resolve({
				status: 400,
				data: {
					success: false,
					error: {
						code: "titleInvalid"
					}
				}
			});
		}

		return db.query(db.escape`
			INSERT INTO
				stream (
					title,
					"streamerId"
				)
			VALUES
				(
					${data.title},
					${data.streamer.id}
				)
			RETURNING *
		`)
	})
	.then((stream) => {
		return discovery.send("start", {
			streamId: stream.id,
			streamer: data.streamer,
			title: stream.title
		}, true, 10000)
		.then((response) => {
			if(response.success) {
				return update(stream.id, {
					title: stream.title,
					streamingServer: response.data.streaming,
					chatServer: response.data.chat
				})
				.then((stream) => {
					return Promise.resolve({
						status: 201,
						data: {
							success: true,
							stream: stream
						}
					});
				});	
			}

			remove(stream.id);

			return Promise.resolve({
				status: 500,
				data: response
			});
		});
	})
	.catch((err) => {
		console.error("[Streams/Create]", err);

		return Promise.reject(err);
	});
}
module.exports.create = create;

function update(id, data) {
	if(!db.isUuid(id)) {
		return Promise.resolve({
			status: 400,
			data: {
				success: false,
				error: {
					code: "invalidParameter"
				}
			}
		});
	}

	return get(id)
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
	return db.query(db.escape`
		UPDATE
			stream
		SET
			title = ${data.title},
			"streamingServer" = ${data.streamingServer},
			"chatServer" = ${data.chatServer}
		WHERE
			id = ${id}
		RETURNING *
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Streams/Update]", err);

		return Promise.reject(err);
	});
}
module.exports.update = update;

function updateSatoshi(id, satoshi) {
	return db.query(db.escape`
		UPDATE
			stream
		SET
			satoshi = ${satoshi}
		WHERE
			id = ${id}
	`)
	.then((result) => {
		return Promise.resolve();
	})
	.catch((err) => {
		console.error("[Streams/UpdateSatoshi]", err);

		return Promise.reject(err);
	});
}
module.exports.updateSatoshi = updateSatoshi;

function remove(id) {
	return db.query(db.escape`
		DELETE FROM
			stream
		WHERE
			id = ${id}
	`)
	.then((result) => {
		return Promise.resolve();
	})
	.catch((err) => {
		console.error("[Streams/Remove]", err);

		return Promise.reject(err);
	});
}
module.exports.remove = remove;