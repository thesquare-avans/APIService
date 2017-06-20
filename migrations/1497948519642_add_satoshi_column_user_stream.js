exports.up = (pgm) => {
	pgm.addColumns("user", {
		satoshi: {
			type: "integer",
			notNull: true,
			default: 0
		}
	});

	pgm.addColumns("stream", {
		satoshi: {
			type: "integer",
			notNull: true,
			default: 0
		}
	});
};

exports.down = (pgm) => {
	pgm.dropColumns("stream", ["satoshi"]);
	pgm.dropColumns("user", ["satoshi"]);
};
