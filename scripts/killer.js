// Go get banned then :)

const killer = new (function() {
	async function sleep(ms) {return new Promise(resolve => {setTimeout(resolve, ms);});}

	const SERVER = "726946122886676561"
	const CHANNELS = [];
	const DMS = [];

	const MESSAGE = "https://discord.com/invite/sbABaJy https://discord.com/invite/j8YAqBe https://discord.com/invite/3cKVsvz https://discord.com/invite/953arjf https://discord.com/invite/uZwWJkQ https://github.com/505e06b2/OpenDiscord/blob/master/scripts/killer.js";



	function generateSnowflake() {
		const epoch = (new Date("2015-01-01")).getTime();
		let ret = BigInt(0);
		ret = ret + (BigInt((new Date()).getTime() - epoch) << 22n);
		ret = ret + (BigInt(1) << 17n);
		ret = ret + (BigInt(1) << 12n);
		ret = ret + BigInt(Math.floor(Math.random() * Math.floor(0xfff)));
		return ret.toString();
	}

	async function messageTemplate(channel, message, referrer) {
		return await fetch(`https://discord.com/api/v6/channels/${channel}/messages`, {
			"headers": {
				"accept": "*/*",
				"accept-language": "en-GB",
				"authorization": "",
				"cache-control": "no-cache",
				"content-type": "application/json",
				"pragma": "no-cache",
				"sec-fetch-dest": "empty",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin"
			},
			"referrer": referrer,
			"referrerPolicy": "no-referrer-when-downgrade",
			"body": `{\"content\":\"${message}\",\"nonce\":\"${generateSnowflake()}\",\"tts\":false}`,
			"method": "POST",
			"mode": "cors",
			"credentials": "include"
		});
	}

	async function sendMessage(channel, message) {
		const ret = await messageTemplate(channel, message, `https://discord.com/channels/${SERVER}/${channel}`);
		return await ret.json();
	}

	async function sendDM(id, message) {
		const ret = await messageTemplate(id, message, `https://discord.com/channels/@me/${id}`);
		return await ret.json();
	}


	let current_interval = null;
	this.start = () => {
		if(current_interval) return;
		current_interval = setInterval(async function() {
			for(const channel of CHANNELS) {
				await sendMessage(channel, MESSAGE);
				await sleep(1000);
			}

			for(const dm of DMS) {
				await sendDM(dm, MESSAGE);
				await sleep(1000);
			}
		}, 1000 * (DMS.length + CHANNELS.length));
	}

	this.stop = () => {
		if(current_interval) {
			clearInterval(current_interval);
			current_interval = null;
		}
	}
})();







