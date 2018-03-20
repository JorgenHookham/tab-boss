document.addEventListener('DOMContentLoaded', () => {

	// Used to notify the background process of a popup being opened and closed.
	var bgConnect = chrome.runtime.connect();

	var select = document.getElementById('select');
	var rotationInterval = document.getElementById('rotation-interval');
	var rotationToggle = document.getElementById('rotation-toggle');
	var socketURL = document.getElementById('socket-url');
	var socketSecret = document.getElementById('socket-secret');
	var socketToggle = document.getElementById('socket-toggle');
	var socketLastReport = document.getElementById('socket-last-report');
	var statefulUIs = [rotationToggle, rotationInterval, socketURL, socketToggle, socketSecret];

	function queryTabBoss (request) {
		return new Promise(
			(resolve, reject) => {
				chrome.runtime.sendMessage(request, (response) => {
					resolve(response);
				});
			}
		);
	};

	queryTabBoss({type: 'API', method: 'get'}).then((state) => {

		if (state.tabCycleIsActive) rotationToggle.checked = true;
		if (state.webSocketIsActive) socketToggle.checked = true;
		rotationInterval.value = state.tabCycleIntervalSeconds;
		socketURL.value = state.webSocketURL || '';
		socketSecret.value = state.webSocketSecret || '';

	});

	function getStateFromUI () {
		return {
			tabCycleIsActive: rotationToggle.checked,
			tabCycleIntervalSeconds: rotationInterval.value,
			webSocketURL: socketURL.value,
			webSocketSecret: socketSecret.value,
			webSocketIsActive: socketToggle.checked
		}
	}

	statefulUIs.forEach((ui) => {
		ui.onchange = (e) => {
			queryTabBoss({
				type: 'API',
				method: 'set',
				data: getStateFromUI()
			});
		}
	});

	chrome.tabs.getSelected(null, (tab) => {
		activeTab = tab;
	});

	chrome.tabs.getAllInWindow(null, (tabs) => {
		allTabs = tabs;
		tabs.forEach((tab) => {
			var option = document.createElement('option');
			option.textContent = tab.title;
			option.value = tab.id;
			option.selected = tab.id == activeTab.id;
			select.appendChild(option);
		});
	});

	select.onchange = (e) => {
		chrome.tabs.update(parseInt(select.value), {active: true});
	};

});
