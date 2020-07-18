(function() {

	const activity = { //https://discord.com/developers/docs/topics/gateway#activity-object
		type: 0,
		name: "with OpenDiscord",
		details: "Get it on Github!",
		application_id: "413437155021553674", //bot -> client_id
		assets: {
			large_image: "733971962950582322", //bot -> art assets -> upload -> inspect element and get the background code
			large_text: "Check my profile for a link!"
		}
	};


	const nativeWebSocket = window.WebSocket;

	window.WebSocket = function(url, protocols) {
		const socket = new nativeWebSocket(url, protocols);

		this.send = (data) => { //tried to proxy this instead, but it didn't work
			const obj = JSON.parse(data);
			switch(obj.op) {
				case 2:
					obj.d.presence.activities = [activity];
					break;

				case 3:
					obj.d.activities = [activity];
					break;
			}
			socket.send(JSON.stringify(obj));
		}

		this.close = (code, reason) => socket.close(code, reason);

		for(const x in socket) {
			if(!this[x]) { //don't overrite anything already here (close/send)
				Object.defineProperty(this, x, {
					get: () => socket[x],
					set: (v) => { socket[x] = v }
				});
			}
		}
	}
})();
