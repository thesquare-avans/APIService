const timings = [];

function responseTime() {
	return Math.round(timings.reduce((a, b) => { return a + b; }, 0) / Math.max(timings.length, 1));
}
module.exports.responseTime = responseTime;

function timingsMiddleware(req, res, next) {
	req.startTime = new Date().getTime();

	res.on("finish", () => {
		timings.push(new Date().getTime() - req.startTime);
	});

	next();
}

setInterval(() => {
	if(timings.length > 10000) {
		timings = timings.slice(-10000);
	}
}, 60000);

module.exports.middleware = {
	timings: timingsMiddleware
};