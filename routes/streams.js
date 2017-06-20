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
	streams.create({
		streamer: req.user,
		title: req.payload.title
	})
	.then((response) => {
		if(response.status == 201) {
			return res.status(201).sign(response.data);
		}

		return res.status(response.status).sign(response.data);
	})
	.catch((err) => {
		console.log(err);
		res.status(500).sign({
			success: false,
			error: {
				code: "unexpectedError"
			}
		});
	});
});

router.get("/:streamId", (req, res) => {
	streams.get(req.params.streamId)
	.then((response) => {
		res.status(response.status).sign(response.data);
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
	streams.update(req.params.streamId, req.payload)
	.then((response) => {
		res.status(response.status).sign(response.data);
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
	streams.remove(req.params.streamId, req.user)
	.then((response) => {
		res.status(response.status).sign(response.data);
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