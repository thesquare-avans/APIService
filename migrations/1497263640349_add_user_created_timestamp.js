exports.up = (pgm) => {
	pgm.addColumns("user", {
		createdOn: {
			type: "timestamp with time zone",
			notNull: true,
			default: pgm.func("NOW()")
		}
	});
};

exports.down = (pgm) => {
	pgm.dropColumns("user", ["createdOn"]);
};
