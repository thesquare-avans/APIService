exports.up = (pgm) => {
	pgm.renameColumn("stream", "ownerId", "streamerId");
};

exports.down = (pgm) => {
	pgm.renameColumn("stream", "streamerId", "ownerId");
};
