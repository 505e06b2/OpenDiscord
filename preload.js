//to disable, comment out any function calls at the bottom of this script

function customActivity() {
	const activity_file = "./activity.json";
	const fs = require("fs");
	//This function requires window.WebSocket to be proxied - if you don't trust it, disable below
	//This may not show up immediately - give it about 30s though and it should show up - if not, maybe check the validity of the following

	//https://discord.com/developers/docs/topics/gateway#activity-object
	//   application_id = https://discord.com/developers/applications -> client_id
	//   large_image/small_image = https://discord.com/developers/applications -> art assets -> upload -> inspect image and get background url for id

	const default_activity = {
		"type": 0,
		"name": "with OpenDiscord",
		"details": "Visit git.io/JJn7D",
		"state": "or go to github.com/505e06b2/OpenDiscord",
		"application_id": "734267150486732828",
		"assets": {
			"large_image": "734267782513950740",
			"small_image": "734267811953639465",
			"small_text": "Get it on GitHub!"
		}
	}

	function getActivity() {
		try {
			//Copy the above object to activity.json for a base - comments won't work though!
			return JSON.parse(fs.readFileSync(activity_file)); //can't just require or it won't be dynamic
		} catch {
			return default_activity;
		}
	}


	const nativeWebSocket = window.WebSocket;
	let current_gateway_socket;
	let current_presence = { //https://discord.com/developers/docs/topics/gateway#update-status-gateway-status-update-structure
		since: 0,
		activities: [],
		status: "online",
		afk: false
	};

	window.WebSocket = function(url, protocols) {
		const socket = new nativeWebSocket(url, protocols);

		this.send = (data) => { //tried to proxy this instead, but it didn't work
			const obj = JSON.parse(data);
			switch(obj.op) {
				case 2:
					current_presence = obj.d.presence;
					obj.d.presence.activities = [getActivity()];
					break;

				case 3:
					current_presence = obj.d;
					obj.d.activities = [getActivity()];
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

		if((new URL(url)).hostname === "gateway.discord.gg") current_gateway_socket = this;
	}

	//watch the json file and update status when changes
	fs.watchFile(activity_file, (current, previous) => {
		if(current_gateway_socket) current_gateway_socket.send(JSON.stringify({op: 3, d: current_presence}));
	});
}

// call functions
customActivity();
