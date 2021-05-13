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
			allow_selfbot_actions: false,
			enable_rich_presence: true
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
		if(favicons.includes("data:image/png;base64,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")) {
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
