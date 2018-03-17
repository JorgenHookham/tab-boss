var audio = new Audio();
audio.src = chrome.runtime.getURL('coin.wav');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type == 'sound') {
		audio.play();
	} else if (request.type == 'notification') {
		console.log(request.message);
		var notificationContainer = document.createElement('div');
		var notification = document.createElement('div');
		var swanson = document.createElement('img');
		var message = document.createElement('div');
		notificationContainer.id = 'tab-boss-notification-container';
		notification.id = 'tab-boss-notification';
		swanson.id = 'tab-boss-swanson';
		swanson.src = chrome.runtime.getURL('swanson.gif');
		message.textContent = request.message;
		notification.appendChild(swanson);
		notification.appendChild(message);
		notificationContainer.appendChild(notification);
		document.querySelector('body').appendChild(notificationContainer);
		setTimeout(() => {
			document.querySelector('#tab-boss-notification-container').remove();
		}, 15000)
	}
});
