const db = require("./db");

function create(data) {
	return db.query(db.escape`
		INSERT INTO
			public.user (
				"keyHash",
				"name",
				"publicKey"
			)
		VALUES
			(
				${data.keyHash},
				${data.name},
				${data.publicKey}
			)
		RETURNING *
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Users/Create]", err);

		return Promise.reject(err);
	});
}
module.exports.create = create;

function getAll() {
	return db.query(db.escape`
		SELECT
			*
		FROM
			public.user
	`)
	.then((result) => {
		return Promise.resolve(result.rows);
	})
	.catch((err) => {
		console.error("[Users/GetAll]", err);

		return Promise.reject(err);
	});
}
module.exports.getAll = getAll;

function get(id) {
	return db.query(db.escape`
		SELECT
			*
		FROM
			public.user
		WHERE
			id = ${id}
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Users/Get]", err);

		return Promise.reject(err);
	});
}
module.exports.get = get;

function getByKeyHash(keyHash) {
	return db.query(db.escape`
		SELECT
			*
		FROM
			public.user
		WHERE
			"keyHash" = ${keyHash}
	`)
	.then((result) => {
		return Promise.resolve(result.rows[0]);
	})
	.catch((err) => {
		console.error("[Users/GetByKeyHash]", err);

		return Promise.reject(err);
	});
}
module.exports.getByKeyHash = getByKeyHash;

function updateSatoshi(id, satoshi) {
	return db.query(db.escape`
		UPDATE
			public.user
		SET
			satoshi = satoshi + ${satoshi}
		WHERE
			id = ${id}
	`)
	.then((result) => {
		return Promise.resolve();
	})
	.catch((err) => {
		console.error("[Users/UpdateSatoshi]", err);

		return Promise.reject(err);
	});
}
module.exports.updateSatoshi = updateSatoshi;