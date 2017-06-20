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
		.then((result) => {
			stream = result.rows[0];

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
						chatServer: response.data.chat,
						user: data.streamer
					})
					.then((res) => {
						if(res.status == 200) {
							return Promise.resolve({
								status: 201,
								data: res.data
							});
						}

						return res;
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
			console.log(err);
			remove(stream.id);

			return Promise.resolve({
				status: 500,
				data: {
					success: false,
					error: {
						code: "unexpectedError"
					}
				}
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
	.then((res) => {
		if(res.status == 200) {
			var stream = res.data.stream;

			if(stream.streamerId != data.user.id) {
				return Promise.resolve({
					status: 403,
					data: {
						success: false,
						error: {
							code: "notStreamOwner"
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
				return Promise.resolve({
					status: 200,
					data: {
						success: true,
						stream: result.rows[0]
					}
				});
			})
		}

		return Promise.resolve(res);
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

function remove(id, user) {
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
	.then((res) => {
		if(res.status == 200) {
			var stream = res.data.stream;
			if(user && stream.streamerId != user.id) {
				return Promise.resolve({
					status: 403,
					data: {
						success: false,
						error: {
							code: "notStreamOwner"
						}
					}
				});
			}

			if(!(stream.hasOwnProperty("chatServer") && stream.chatServer != null) || !(stream.hasOwnProperty("streamingServer") && stream.streamingServer != null)) {
				return db.query(db.escape`
					DELETE FROM
						stream
					WHERE
						id = ${id}
				`)
				.then(() => {
					return Promise.resolve({
						status: 200,
						data: {
							success: true
						}
					}); 
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

					return users.updateSatoshi(user.id, satoshi)
					.then(() => {
						return db.query(db.escape`
							DELETE FROM
								stream
							WHERE
								id = ${id}
						`)
						.then((result) => {
							return Promise.resolve({
								status: 200
							});
						});
					})
					.then(() => {
						return Promise.resolve({
							status: 200,
							data: {
								success: true,
								chatServer: response.chatServer,
								streamingServer: response.streamingServer
							}
						});
					});
				}

				return Promise.resolve({
					status: 500,
					data: {
						success: false,
						error: response.error
					}
				});
			})
			.catch((err) => {
				console.error("[Discovery/Stop]", err);
				return Promise.resolve({
					status: 500,
					data: {
						success: false,
						error: "unexpectedError"
					}
				});
			});
		}

		return Promise.resolve(res);
	})
	.catch((err) => {
		console.error("[Streams/Remove]", err);

		return Promise.reject(err);
	});
}
module.exports.remove = remove;