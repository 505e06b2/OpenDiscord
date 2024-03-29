//to disable, comment out any function calls at the bottom of this script

function customActivity() {
	const activity_file = "./activity.json";
	const settings_file = "./settings.json";
	const fs = require("fs");

	let rich_presence_enabled = false;
	try {
		rich_presence_enabled = JSON.parse(fs.readFileSync(settings_file))["enable_rich_presence"]; //can't just require or it won't be dynamic
	} catch {}

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

	window.WebSocket = new Proxy(nativeWebSocket, {
		construct(target, args) {
			const socket = new target(...args);

			socket.send = new Proxy(socket.send, {
				apply: function(target, thisArg, argumentsList) {
					const obj = JSON.parse(argumentsList[0]);
					if(rich_presence_enabled) {
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
					}
					return Reflect.apply(target, thisArg, [JSON.stringify(obj)]);
				}
			});

			if((new URL(args[0])).hostname === "gateway.discord.gg") current_gateway_socket = socket;
			return socket;
		}
	});

	//watch the json file and update status when changes
	fs.watchFile(activity_file, (current, previous) => {
		if(current_gateway_socket) current_gateway_socket.send(JSON.stringify({op: 3, d: current_presence}));
	});
}

customActivity();
window.LOCAL_STORAGE = window.localStorage;
