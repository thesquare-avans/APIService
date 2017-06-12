exports.up = (pgm) => {
	pgm.createTable("stream", {
		id: {
			type: "uuid",
			default: pgm.func("gen_random_uuid()"),
			primaryKey: true
		},
		title: {
			type: "character varying",
			notNull: false
		},
		streamingServer: {
			type: "character varying",
			notNull: true
		},
		chatServer: {
			type: "character varying",
			notNull: true
		},
		ownerId: {
			type: "uuid",
			references: pgm.func("public.user (id)"),
			onDelete: "CASCADE",
			notNull: true
		}
	});
};

exports.down = (pgm) => {
	pgm.dropTable("stream");
};
