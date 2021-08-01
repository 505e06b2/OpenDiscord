(async function() {
	function getMessageContainer(currentTag) {
        for(; currentTag != document.body; currentTag = currentTag.parentElement) {
            if(currentTag.id.startsWith("chat-messages-")) return currentTag;
        }
        return null;
    }

	function editMessage(e) {
        const message = getMessageContainer(e.target);
        console.log(message);
        if(!message) return;
        e.preventDefault();

        message.querySelector('div[aria-label="Message actions"] div[aria-label="Edit"]').click();
    }

	document.body.ondblclick = editMessage;
})();
