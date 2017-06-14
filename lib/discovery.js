const config = require("config");
const socket = require("socket.io-client")(config.get("discoveryServer"));
const integrity = require("./integrity");
const health = require("./health");
var listeners = {};

var isRegistered = false;

socket.on("connect", () => {
	console.log("[Socket.io/Connection] Connected to Discovery Service");

	module.exports.send("register", {
		type: "api",
		id: config.get("serverId")
	});
});

socket.on("disconnect", () => {
	isRegistered = false;
	console.log("[Socket.io/Connection] Disconnected from Discovery Service");
});

module.exports.send = (event, data) => {
	socket.emit(event, integrity.sign(data));
}

module.exports.on = (event, callback) => {
	socket.on(event, (data) => {
		if(data.payload == undefined || data.signature == undefined) {
			console.error("SOMETHING WENT WRONG", data);
			return;
		}

		var verifiedData = integrity.verify(data.payload, data.signature);
		if(!verifiedData) {
			return callback(new Error("Invalid signature"));
		}

		return callback(verifiedData);
	});
}

module.exports.on("registerCallback", (data) => {
	if(data.success) {
		isRegistered = true;
		console.log("[Socket.io/Register]", "Registered with Discovery Service");
		return;
	}

	console.error("[Socket.io/Register]", data.error.code);
});

module.exports.on("error", (data) => {
	console.error("[Socket.io/Error]", data);
});

// Respond to requests only once and with the corect data
module.exports.request = (requestId, event, data) => {
	// Data is optional
	if(!data) {
		data = {};
	}

	// Send requestee with all events
	data.requestId = requestId;

	module.exports.send(event, data);

	// Check if a listener for this event has already been defined
	return new Promise((resolve, reject) => {
		if(!listeners.hasOwnProperty(event)) {
			listeners[event] = {};

			// Listen for Socket.io callback
			module.exports.on(event+"Callback", (response) => {
				// If there is no requestId sent back, there's no 
				// need to serve people different data
				if(!response.requestId) {
					Object.keys(listeners[event]).forEach((id) => {
						listeners[event][id](response);
					});
					listeners[event] = {};
					return;
				}

				var requestId = response.requestId;
				if(listeners[event].hasOwnProperty(requestId)) {
					delete response.requestId;
					listeners[event][requestId](response);
					delete listeners[event][requestId];
				}
			});
		}

		listeners[event][requestId] = resolve;
	});
}

module.exports.on("status", (data) => {
	module.exports.send("statusCallback", {
		success: true,
		requestId: data.requestId,
		data: {
			status: "green",
			averageResponseTime: health.responseTime()
		}
	});
});