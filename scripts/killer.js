const killer = new (function() {
	async function sleep(ms) {return new Promise(resolve => {setTimeout(resolve, ms);});}

	//BTS
	const SERVER = "199993370691633152"
	const CHANNELS = ["730886083989995561"];

	//Retard Zone
	//const SERVER = "540586684782477313";
	//const CHANNELS = ["723125510284247040", "723978747971240067"];

	const USERAGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36";
	const MESSAGE = "https://discord.com/invite/sbABaJy https://discord.com/invite/j8YAqBe https://discord.com/invite/3cKVsvz https://discord.com/invite/953arjf https://discord.com/invite/uZwWJkQ";

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
			"user-agent": USERAGENT,
			"pragma": "no-cache",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin"
		  },
		  "referrer": referrer,
		  "referrerPolicy": "no-referrer-when-downgrade",
		  "body": `{\"content\":\"${message}\",\"nonce\":\"${generateSnowflake()}\",\"tts\":false}`,
		  "method": "POST",
		  "mode": "cors"
		});
	}

	async function sendMessage(channel, message) {
		const ret = await messageTemplate(channel, message, `https://discord.com/channels/${SERVER}/${channel}`);
		return await ret.json();
	}

	async function sendDM(id, message) {
		const ret = await messageTemplate(channel, message, `https://discord.com/channels/@me/${id}`);
		return await ret.json();
	}


	let current_interval = null;
	this.start = () => {
		if(current_interval) return;
		current_interval = setInterval(async function() {
			console.log(await sendMessage(CHANNELS[0], MESSAGE));
		}, 1000);
	}

	this.stop = () => {
		if(current_interval) {
			clearInterval(current_interval);
			current_interval = null;
		}
	}
})();







