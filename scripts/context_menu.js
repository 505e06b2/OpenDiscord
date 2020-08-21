(async function() {
    "use strict";

    async function sleep(ms) {return new Promise(resolve => {setTimeout(resolve, ms);});}

    function getMessageContainer(currentTag) {
        for(; currentTag != document.body; currentTag = currentTag.parentElement) {
            if(currentTag.id.startsWith("chat-messages-")) return currentTag;
        }
        return null;
    }

    const reaction_dict = {
        " ": ["▪", "◾", "▫", "◽"],

        "a": ["🇦", "🅰️", "4️⃣"],
        "b": ["🇧", "🅱️"],
        "c": ["🇨", "©", "🗜️"],
        "d": ["🇩", "🆔", "↩️", "▶️"],
        "e": ["🇪", "3️⃣", "☪️", "📧"],
        "f": ["🇫", "⏮️"],
        "g": ["🇬", "9️⃣", "🆖"],
        "h": ["🇭", "♓"],
        "i": ["🇮", "ℹ"],
        "j": ["🇯", "🌶️"],
        "k": ["🇰", "⏪"],
        "l": ["🇱", "1️⃣"],
        "m": ["🇲", "Ⓜ️"],
        "n": ["🇳", "♑", "♎"],
        "o": ["🇴", "🅾️", "⭕"],
        "p": ["🇵", "🅿️"],
        "q": ["🇶", "📯"],
        "r": ["🇷", "®"],
        "s": ["🇸", "5️⃣"],
        "t": ["🇹", "✝️", "7️⃣", "🍄"],
        "u": ["🇺", "⛎"],
        "v": ["🇻", "♈", "🔽"],
        "w": ["🇼", "〰️"],
        "x": ["🇽", "❌"],
        "y": ["🇾", "🏅"],
        "z": ["🇿", "💤"],

        "0": ["0️⃣", "⭕"],
        "1": ["1️⃣"],
        "2": ["2️⃣"],
        "3": ["3️⃣"],
        "4": ["4️⃣"],
        "5": ["5️⃣"],
        "6": ["6️⃣"],
        "7": ["7️⃣"],
        "8": ["8️⃣"],
        "9": ["9️⃣"]
    }

    function getFreeReaction(message, char) {
        const reactions_bar = message.querySelector('div[class^=reactions-]');
        const char_info = reaction_dict[char];
        for(let i = 0; i < char_info.length; i++) {
            if(reactions_bar && reactions_bar.querySelector(`img[alt="${char_info[i]}"]`)) continue;
            return char_info[i];
        }
        return null;
    }

    async function setReaction(message, message_id, reaction) {
        const codepoint = encodeURI(reaction);
        const current_url = window.location.href;
        let channel_id = current_url.split("/");
        channel_id = channel_id[channel_id.length-1];

        await fetch(`https://discord.com/api/v6/channels/${channel_id}/messages/${message_id}/reactions/${codepoint}/%40me`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB",
                "authorization": "", //replaced by index.js when sent - must be empty for the script to replace
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                //"x-super-properties": "tracking info should be removed from all headers"
            },
            "referrer": current_url,
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": null,
            "method": "PUT",
            "mode": "cors",
            "credentials": "include"
        });
    }

    async function writeReactionSequence(message, text) {
        text = text.toLowerCase();
        const message_id = await getMessageId(message);

        for(let i = 0; i < text.length; i++) {
            const code = getFreeReaction(message, text[i]);
            if(!code) {
                console.log("[REACTIONS] Skipping " + text[i]);
                continue;
            }

            await setReaction(message, message_id, code);
            await sleep(100);
        };
    }

    function alterContextMenu(message, x, y) {
        const popout_menu = document.querySelector('div[class^=layerContainer] > div[id^="popout"]');

        const items = popout_menu.querySelectorAll('div[aria-label="Message Actions"] div[id^="message-actions-"]');
        const addMenuItem = (text, func) => {
            const new_item = items[0].cloneNode(true);
            new_item.id = "";
            new_item.querySelector('div[class^="label"]').innerText = text;
            new_item.querySelector('svg').outerHTML = "";
            new_item.onclick = func;
            popout_menu.querySelector('div[aria-label="Message Actions"] div[class^="scroller-"]').prepend(new_item);
        }

        addMenuItem("Add Reaction", () => { message.querySelector('div[aria-label="Message Actions"] div[aria-label="Add Reaction"]').click(); });
        if(SELFBOT_ACTIONS_ENABLED) { //set by index.js if "allow_selfbot_actions" is true
			addMenuItem("Write in Reaction", () => {
				const messagebox_element = document.querySelector('div[class^="textArea"] > div[aria-label^="Message "] > div[data-slate-object="block"]');
				writeReactionSequence(message, messagebox_element.innerText.trim());
			});
		}

        popout_menu.style = `
            position: absolute;
            left: ${x - popout_menu.clientWidth/2}px;
            top: ${y - popout_menu.clientHeight/2}px;
        `;
    }

    async function getMessageId(message) {
        const popout_menu = document.querySelector('div[class^=layerContainer] > div[id^="popout"]');
        popout_menu.querySelector('#message-actions-copy-id').click();
        return await navigator.clipboard.readText();
    }

    async function openMenu(e) {
        const message = getMessageContainer(e.target);
        if(!message) return;
        e.preventDefault();

        message.querySelector('div[aria-label="Message Actions"] div[aria-label="More"]').click();
        alterContextMenu(message, e.clientX, e.clientY);
    }

    document.body.oncontextmenu = openMenu;
})();
