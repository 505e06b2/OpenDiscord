<br>
<br>
<img src="assets/icon.png?raw=true" width="200" height="200" align="center" alt="OpenDiscord Icon">
<center><b>OpenDiscord</b></center>

## What is this?
This is an alternative to other solutions, the main one being BetterDiscord. When it comes to using the desktop version of Discord, you're forced to trust the system to not be malicious, even when it's able to view all your system processes and any keypress you make, even when the program is in the background. The current alternative is to use the browser version, and I recommend using it over OpenDiscord if possible. Every script and stylesheet included in this repo should work with any decent userscript + stylesheet injector, but may not get full functionality.

Before you run any code, please audit what you are launching; that's the whole point in the first place.

## Features
- As FOSS as possible
- Enhanced privacy
- Disabled tracking
- Spoofed Useragent (Windows 10/Chrome)
- Custom [activities](https://discord.com/developers/docs/topics/gateway#activity-object)
- Faster startup
- Javascript mod support
- CSS styling support
- Selfbot support
- 1 dependency (Electron)

## Installation
### Prerequisites
- git
- nodejs + npm

### Install
```bash
git clone https://github.com/505e06b2/OpenDiscord
cd OpenDiscord
npm i
```

### Run
```bash
cd OpenDiscord
npm start
```
