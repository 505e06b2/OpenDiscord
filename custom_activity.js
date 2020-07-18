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

/*(function() {
	const types = {
		playing: 0,
		streaming: 1,
		listening: 2,
		watching: 3,
		custom: 4
	};

	{
		op: 3,
		d: {
			status: "online",
			activities: [{type: 0, name: "custom scripts"}]
		}
	}

			let activity={
				type:window.SetDiscordActivityData.activityType,
				name:window.SetDiscordActivityData.activityName
			}

	window.SetDiscordActivityData={
		sendUpdate:false,
		activityType:0,
		activityName:"Set Discord Activity",
		activityUrl:"https://twitch.tv/settings",
		activityDetails:"",
		activityState:"",
		activityPartyCur:"",
		activityPartyMax:""
	}

	window.WebSocket.prototype.send=function(d)
	{
		if(this.downstreamSocket==window.SetDiscordActivityActiveSocket)
		{
			console.log(d)
			const start=d.substr(0,8)
			if(start=='{"op":3,')
			{
				const j=JSON.parse(d)
				status=j.d.status
				since=j.d.since
				afk=j.d.afk
				window.SetDiscordActivitySendStatus()
			}
			else
			{
				if(start=='{"op":2,')
				{
					clearInterval(timer)
					timer=setInterval(()=>{
						if(window.SetDiscordActivityData.sendUpdate)
						{
							window.SetDiscordActivityData.sendUpdate=false
							window.SetDiscordActivitySendStatus()
						}
					},500)
				}
				this.downstreamSocket.send(d)
			}
		}
		else
		{
			this.downstreamSocket.send(d)
		}
	}
	window.WebSocket.prototype.close=function(c,r)
	{
		this.downstreamSocket.close(c,r)
	}
	window.WebSocket.CONNECTING=originalWebSocket.CONNECTING
	window.WebSocket.OPEN=originalWebSocket.OPEN
	window.WebSocket.CLOSING=originalWebSocket.CLOSING
	window.WebSocket.CLOSED=originalWebSocket.CLOSED
	window.SetDiscordActivitySendStatus=()=>{
		if(window.SetDiscordActivityActiveSocket&&window.SetDiscordActivityActiveSocket.readyState==originalWebSocket.OPEN)
		{
			let activity={
				type:window.SetDiscordActivityData.activityType,
				name:window.SetDiscordActivityData.activityName
			}
			if(window.SetDiscordActivityData.activityType==1)
			{
				activity.url=window.activityUrl
			}
			if(window.SetDiscordActivityData.activityPartyCur!=""&&window.SetDiscordActivityData.activityPartyMax!="")
			{
				activity.party={size:[window.SetDiscordActivityData.activityPartyCur,window.SetDiscordActivityData.activityPartyMax]}
			}
			if(window.SetDiscordActivityData.activityDetails)
			{
				activity.details=window.SetDiscordActivityData.activityDetails
			}
			if(window.SetDiscordActivityData.activityState)
			{
				activity.state=window.SetDiscordActivityData.activityState
			}
			window.SetDiscordActivityActiveSocket.send(JSON.stringify({op:3,d:{
				status,
				activities:[activity],
				since,
				afk
			}}))
		}
	}
})();
*/
