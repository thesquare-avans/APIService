exports.up = (pgm) => {
	pgm.alterColumn("user", "satoshi", {
		default: 1
	});
};

exports.down = (pgm) => {
	pgm.alterColumn("user", "satoshi", {
		default: 0
	});
};
