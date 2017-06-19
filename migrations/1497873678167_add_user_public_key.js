exports.up = (pgm) => {
	pgm.addColumns("user", {
		publicKey: {
			type: "character varying",
			notNull: false
		}
	});
};

exports.down = (pgm) => {
	pgm.dropColumns("user", ["publicKey"]);
};
