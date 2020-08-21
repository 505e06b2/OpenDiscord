#!/usr/bin/env node
const electron = require("electron");
const child_process = require("child_process");
const process = require("process");
const fs = require("fs");
const path = require("path");
const string_decoder = require("string_decoder").StringDecoder;

//remove CSP warning - Discord has its own CSP settings
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

electron.app.on("ready", () => {
	electron.app.userAgentFallback = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
	let quit = false;
	let account_token = ""; //issues may arise from having userbots enabled, turning it off in the settings, then reloading

	const tray_icon = new electron.Tray("assets/icon.png");
	const context_menu = electron.Menu.buildFromTemplate([
		{
			label: "Open Discord", enabled: false
		},
		{
			label: "Show Window", click: () => win.show()
		},
		{
			type: "separator"
		},
		{
			label: "Quit", click: () => {
				quit = true;
				electron.app.quit();
			}
		},
	]);
	tray_icon.setToolTip("OpenDiscord");
	tray_icon.on("click", (event, bounds, position) => win.show());
	tray_icon.setContextMenu(context_menu);

	const win = new electron.BrowserWindow({
		webPreferences: {
			nodeIntegration: false,
			spellcheck: true,
			enableRemoteModule: false,
			preload: path.join(process.cwd(), "preload.js") //this needs to proxy the WebSocket object
		},

		show: false,
		width: 1280,
		height: 720,
		minWidth: 100,
		minHeight: 100,

		icon: "assets/icon.png"
	});

	//win.webContents.openDevTools();

	const settings = new (function () {
		const settings_file = "settings.json";
		const defaults = {
			styles_dir: "styles",
			scripts_dir: "scripts",
			show_menu_bar: true,
			window_bounds: {},
			save_window_bounds_on_exit: false,
			close_to_tray: true,
			start_in_tray: false,
			allow_selfbot_actions: false
		};
		fs.writeFileSync("default_settings.json", JSON.stringify(defaults, null, 4));
		let contents = defaults;

		this.load = () => {
			try {
				const file_contents = JSON.parse(fs.readFileSync(settings_file));
				if(typeof(file_contents) !== "object" || Array.isArray(file_contents)) throw "Settings is not an object";
				contents = file_contents;
				console.log(`Loaded ${settings_file}`);
			} catch(e) {
				console.error(`Cannot load ${settings_file}:\n${e}`);
			}
		};

		this.save = () => {
			if(this.get("save_window_bounds_on_exit")) { //only save automatically if this is set
				contents.window_bounds = win.getBounds();
				fs.writeFileSync(settings_file, JSON.stringify(contents, null, 4));
			}
		}

		this.get = (key) => { //fall back to defaults
			if(typeof(contents[key]) !== "undefined") return contents[key];
			return defaults[key];
		};
	})();


	// == Window Events ==
	win.on("close", (event) => {
		if(!quit) {
			event.preventDefault();
			win.hide();
			return false;
		}
		settings.save();
	});

	// == Document Events ==
	win.webContents.on("dom-ready", (event) => {
		console.log("\n========== PAGE LOAD ==========\n");
		function readFile(folder, name) {
			return (new string_decoder()).write(fs.readFileSync(path.join(folder, name)));
		}

		settings.load();
		try {
			win.setBounds(settings.get("window_bounds"));
		} catch {console.error("window_bounds was not valid");}
		quit = !settings.get("close_to_tray");
		if(!settings.get("start_in_tray")) win.show();
		win.setMenuBarVisibility( settings.get("show_menu_bar") );
		win.webContents.executeJavaScript(`const SELFBOT_ACTIONS_ENABLED = ${settings.get("allow_selfbot_actions")};`).then((r) => {if(r) console.error(r)});

		const styles_dir = settings.get("styles_dir");
		const scripts_dir = settings.get("scripts_dir");

		//Load mods
		(async () => {
			console.log(`\nLoaded CSS files (${styles_dir}/):`);
			for(const file_name of fs.readdirSync(styles_dir)) {
				win.webContents.insertCSS( readFile(styles_dir, file_name) );
				console.log(`- ${file_name}`);
			}

			console.log(`\nLoaded Javascript files (${scripts_dir}/):`);
			for(const file_name of fs.readdirSync(scripts_dir)) {
				(async (s, f) => {
					try {
						await win.webContents.executeJavaScript(readFile(s, f));
						console.log(`- ${file_name}`);
					} catch {
						console.error(`- (FAILED) ${file_name}`);
					}
				})(scripts_dir, file_name);
			}
		})();
	});

	//document.querySelector('link[rel="icon"]').href
	win.webContents.on("page-favicon-updated", (event, favicons) => {
		if(favicons.includes("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADxElEQVRYR+1XS0wTaxT+ZoaWabVUQN6Uh4XY+ojv5C50YUJu7uIaY4wujGI06EqjIo2Jj5WPGAsYjRu8JsbHSu8z92rie2GMMVEjC2kJVKBY5FlTCp0+mBnzj3bo0NIO2qsuPJu285//nO//zjnfP6XwyTbdEJkyt/MIROwDkBN9nuZPLyicc5dZTt7cTPEkNhVNcLDReRSieDzNCROHo6hjTQ2WE0oAdscwgNyvAgAYabJZ504FIH6l5FKaJptVYn+yBHbHDwDTMlCcl4kVC42YY9DAMxhEq3MUOpZBppaW6AyGBYQjAtYsz0ZxHouedxxevPahbyg0bVVVlcCgz8CGmgIU5GrRPxyWEpYXsVLyROYfn0CXhwObSaMkn0WnO4C/HwzAH5iIc1cFYOuvxVhcbZA2M4zcLqp6NRIRoNHQeOUcxfX/+mYOwGjIwJHdVaBnljcukSACJy92wudXspCSgV9W56Hmp/TIwr2nw7jzhMjMpKUEcHiXGTlGjSq6Uzl5fRGc+s2lHgDp+vrtlXFxQ2EBbweCKC1g5QmIOo0FeAx6Qygr0iEjQb80X+lSTEVSBtasyMH6tfkKAFyQR/PVbrwfjSA7S4P62gp5Gobeh3H+eg+4EA9TIYs9W8rBTGmefx4N4vELrxwzKQDS/UstWQoAre1+XPvXIz/btq4ES+Z/nJCHz0Zw+/GQvLZ/W4XEUqxNnYakAAj9pAyxRk7ZeLkLvCBKp2vYUYm8bK3k0uEeR8uNXum7XsfgcJ1Z0oJYI6JEyhC1pACO76lOKDY9fRzaXGNYYJ6N8mKdIoHjzRjI+jJrFgpyleCJIynhsQsd6gDYGyzyLUX0meN46WQzMdIPWg0t9wKJY2t0qgNg21GpOAWhj5ywvEiHeSZ9UnFyv+Pg6g2gslSPihiWBkZCsF9WWQLDrAyQRjSb9DJiomgv23z46/4ASgtZ5OdooWcZ0DSFcY6H1xdGb38QRMBWLTIqRpEAInJM7gpVPUCciAJbzbOxcqFROgkpwaU/eqULJplVlelRt9GEQJBHt4fD89c+OFxjmHrVplTCmdT7c3x/APguGSDdpVSXzynu5J5+AMbpYsYx0GB3XBGB2i/LqdjtF2lhAyXQfwJQXiyJXssPnXYZJ5jw7wBq0gWCAtYKtOCjBPouAOmPyLQ6EF042NhuoUShMB0geIbuOFs/32M701YtUPQDQDSlBJCOxIliHGhuL6F54RaAJWQ9rgf+r8Sxcfee78jShCZuUsDP3wQAAbO75bnGMDqrpclm3Ul+fwCF65kwy+AsFwAAAABJRU5ErkJggg==")) {
			tray_icon.setImage("assets/icon.png");
		} else {
			tray_icon.setImage("assets/icon_notification.png");
		}
	});

	win.webContents.on("new-window", (event, url, frameName, disposition, options, additionalFeatures, referrer) => {
		event.preventDefault();
		switch(process.platform) {
			case "win32":
				child_process.exec(`start ${url}`);
				break;

			default:
				child_process.exec(`xdg-open "${url}"`);
		}
	});

	win.webContents.on("context-menu", (event, params) => {
		if(params.misspelledWord) {
			const menu = new electron.Menu();

			for(const suggestion of params.dictionarySuggestions) {
				menu.append(new electron.MenuItem({
					label: suggestion,
					click: () => win.webContents.replaceMisspelling(suggestion)
				}));
			}

			menu.popup();
		}
	});

	electron.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
		const blacklist = [ //thanks to JamesLLL
			///^https?:\/\/discord(app)?\.com\/api\/v\d\/channels\/\d*\/typing/, //Uncomment to disable typing notification
			/^https?:\/\/discord(app)?\.com\/api\/v\d\/track/,
			/^https?:\/\/discord(app)?\.com\/api\/v\d\/science/,
			/^https?:\/\/discord(app)?\.com\/api\/v\d\/promotions\/ack/,
			/^https?:\/\/discord(app)?\.com\/api\/v\d\/experiments/,
		];
		callback({ cancel: blacklist.some((r) => details.url.match(r)) });
	});

	//Grab the authorisation keys so userscripts can perform selfbot actions
	electron.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		if(details.url.match(/^https?:\/\/discord(app)?.com\/api\/v\d\//)) {
			const headers = {}; //headers may start with capital letters, so we manipulate for consistency
			for(const x in details.requestHeaders) headers[x.toLowerCase()] = details.requestHeaders[x];

			if("authorization" in headers && settings.get("allow_selfbot_actions")) {
				if(headers["authorization"] === "") {
					headers["authorization"] = account_token; //replace if blank
				} else {
					account_token = headers["authorization"]; //set if given
				}
			}

			delete headers["x-super-properties"];
			details.requestHeaders = headers;
		}
		callback(details);
	});

	win.loadURL("https://discord.com/channels/@me/");
});
