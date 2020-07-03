(function() {
    "use strict";

    async function sleep(ms) {return new Promise(resolve => {setTimeout(resolve, ms);});}

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
                "authorization": "mfa.iVjsVLVXirbIQjsKkJcmT0gHX2j1kTldby6aLoZZU8oslfErdmUl2JBh_OznToOJfrG_HOP3VZoW6uOyO6bG",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-super-properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChYMTE7IExpbnV4IHg4Nl82NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzgzLjAuNDEwMy45OCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiODMuMC40MTAzLjk4Iiwib3NfdmVyc2lvbiI6IiIsInJlZmVycmVyIjoiaHR0cHM6Ly9kaXNjb3JkLmNvbS9sb2dpbiIsInJlZmVycmluZ19kb21haW4iOiJkaXNjb3JkLmNvbSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo2MTkyMywiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0="
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
        /* THIS IS BROKEN UNTIL PROMPT IS ACCOUNTED FOR
        addMenuItem("Write in Reaction", () => {
            writeReactionSequence(message, prompt("Enter Reaction Text (When the popup comes up, type \":\", then press Enter"));
        });
        */

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

    function getMessageContainer(currentTag) {
        for(; currentTag != document.body; currentTag = currentTag.parentElement) {
            if(currentTag.id.startsWith("messages-")) return currentTag;
        }
        return null;
    }

    async function openMenu(e) {
        const message = getMessageContainer(e.target);
        if(!message) return;
        e.preventDefault();

        message.querySelector('div[aria-label="Message Actions"] div[aria-label="More"]').click();
        alterContextMenu(message, e.clientX, e.clientY);
    }

    async function editMessage(e) {
        const message = getMessageContainer(e.target);
        if(!message) return;
        e.preventDefault();

        message.querySelector('div[aria-label="Message Actions"] div[aria-label="Edit"]').click();
    }

    document.body.oncontextmenu = openMenu;
    document.body.ondblclick = editMessage;
})();
