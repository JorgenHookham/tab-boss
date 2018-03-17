var audio = new Audio();
audio.src = chrome.runtime.getURL('coin.wav');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type == "notification") {
		audio.play();
		var notificationContainer = document.createElement('div');
		var notification = document.createElement('div');
		notificationContainer.id = 'tab-boss-notification-container';
		notification.id = 'tab-boss-notification';
		notification.textContent = request.message;
		notificationContainer.appendChild(notification);
		document.querySelector('body').appendChild(notificationContainer);
		setTimeout(() => {
			document.querySelector('#tab-boss-notification-container').remove();
		}, 15000)
	}
});
