exports.up = (pgm) => {
	pgm.createTable("user", {
		id: {
			type: "uuid",
			default: pgm.func("gen_random_uuid()"),
			primaryKey: true
		},
		keyHash: {
			type: "character varying",
			notNull: true,
			unique: true
		},
		name: {
			type: "character varying",
			notNull: true
		}
	});
};

exports.down = (pgm) => {
	pgm.dropTable("user");
};
