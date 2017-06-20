const db = require("./db");

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
	return db.query(db.escape`
		SELECT
			*
		FROM
			stream
		WHERE
			id = ${id}
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Streams/Get]", err);

		return Promise.reject(err);
	});
}
module.exports.get = get;

function getByOwner(id) {
	return db.query(db.escape`
		SELECT
			*
		FROM
			stream
		WHERE
			"ownerId" = ${id}
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Streams/GetByOwner]", err);

		return Promise.reject(err);
	});
}
module.exports.getByOwner = getByOwner;

function create(data) {
	return db.query(db.escape`
		INSERT INTO
			stream (
				title,
				"ownerId"
			)
		VALUES
			(
				${data.title},
				${data.owner.id}
			)
		RETURNING *
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Streams/Create]", err);

		return Promise.reject(err);
	});
}
module.exports.create = create;

function update(id, data) {
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