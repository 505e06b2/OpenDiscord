#!/usr/bin/env node
const electron = require("electron");
const child_process = require("child_process");
const platform = require("process").platform;
const fs = require("fs");
const path = require("path");
const string_decoder = require('string_decoder').StringDecoder;

const styles_dir = "styles";
const scripts_dir = "scripts";
const separator = " ";

class Settings {
    constructor(file_path) {
		this.file_path = file_path;
		let default_settings = "800\n600\n0\n0\ntrue\ntrue";

        // Write default settings if the settings file does not exist.
        if (!fs.existsSync(this.file_path)) {
            fs.writeFileSync(this.file_path, default_settings, (err) => { if (err) throw err; });
        }

		// Read settings file and assign attributes based on the split.
		let data = fs.readFileSync(this.file_path, 'utf8').split("\n");
        this.width = Number(data[0]);
		this.height = Number(data[1]);
		this.x = Number(data[2]);
		this.y = Number(data[3]);
		if(data[4] === "true") {
			this.close_to_taskbar = true;
		} else {
			this.close_to_taskbar = false;
		}
		if(data[5] === "true") {
			this.no_menu = true;
		} else {
			this.no_menu = false;
		}
	}

	// Sets the offset of the class.
	// This is necessary to keep the same window position over time.
	// Needs to be called after the window has been drawn.
	setOffset(window_position) {
		this.offset_x = window_position[0] - this.x;
		this.offset_y = window_position[1] - this.y;
	}

	// Updates the x and y attributes to the current window position accounting for the offset.
	updatePosition(window_position) {
		this.x = window_position[0] - this.offset_x;
		this.y = window_position[1] - this.offset_y;
	}

	// Save the current settings to file.
	save() {
		let data = `${this.width}\n${this.height}\n${this.x}\n${this.y}\n${this.close_to_taskbar}\n${this.no_menu}`;
		fs.writeFileSync(this.file_path, data, (err) => { if (err) throw err; });
	}
}

electron.app.on("ready", () => {
	let quit = false;
	let settings = new Settings("settings.txt")

	const win = new electron.BrowserWindow({
		width: settings.width,
		height: settings.height,
		webPreferences: {
			nodeIntegration: false,
			spellcheck: true
		},
		titleBarStyle: "hidden",
		icon: "assets/icon.png"
	});

	win.setPosition(settings.x, settings.y);
	if(settings.no_menu) { win.removeMenu(); }
	//win.webContents.openDevTools();

	const tray_icon = new electron.Tray("assets/icon.png");
	const context_menu = electron.Menu.buildFromTemplate([
		{
			label: "Show Window", click: () => win.show()
		},
		{	label: separator },
		{
			label: "Quit", click: () => {
				quit = true;
				electron.app.quit();
			}
		},
	]);
	tray_icon.setContextMenu(context_menu);

	win.on("close", (event) => {
		if(settings.close_to_taskbar) {
			if(!quit) {
				event.preventDefault();
				win.hide();
				return false;
			}
		}
		settings.updatePosition(win.getPosition());
		settings.save();
	});

	win.webContents.on("dom-ready", async (event) => {
		settings.setOffset(win.getPosition());

		const readFile = (folder, name) => {
			return (new string_decoder()).write(fs.readFileSync(path.join(folder, name)));
		};

		console.log("\nDOM Ready...");
		console.log(`Loaded CSS files (${styles_dir}/):`);
		for(const file_name of fs.readdirSync(styles_dir)) {
			win.webContents.insertCSS( readFile(styles_dir, file_name) );
			console.log(`- ${file_name}`);
		}

		console.log(`\nLoaded Javascript files (${scripts_dir}/):`);
		for(const file_name of fs.readdirSync(scripts_dir)) {
			win.webContents.executeJavaScript(readFile(scripts_dir, file_name));
			console.log(`- ${file_name}`);
		}
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
		switch(platform) {
			case "win32":
				child_process.exec(`start "${url}"`);
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

			menu.append(new electron.MenuItem({label: separator}));

			menu.append(
				new electron.MenuItem({
					label: "Add to dictionary",
					click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
				})
			)

			menu.popup();
		}
	});

	/*
	//Disable CSP, so that inline JS can be injected
	electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		for(const key in details.responseHeaders) {
			if(key === "content-security-policy") {
				details.responseHeaders[key] = [ "" ];
			}
		}
		callback(details);
	});
	*/

	win.loadURL("https://discord.com/channels/@me/");
});
