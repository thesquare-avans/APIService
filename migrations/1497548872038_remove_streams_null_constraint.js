exports.up = (pgm) => {
	pgm.dropColumns("stream", ["chatServer", "streamingServer"]);
	pgm.addColumns("stream", {
		chatServer: {
			type: "json",
			notNull: false
		},
		streamingServer: {
			type: "json",
			notNull: false
		}
	});
};

exports.down = (pgm) => {
	pgm.dropColumns("stream", ["chatServer", "streamingServer"]);
	pgm.addColumns("stream", {
		streamingServer: {
			type: "character varying",
			notNull: true
		},
		chatServer: {
			type: "character varying",
			notNull: true
		}
	});
};
