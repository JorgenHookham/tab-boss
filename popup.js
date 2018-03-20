document.addEventListener('DOMContentLoaded', () => {

	var select = document.getElementById('select');
	var rotationInterval = document.getElementById('rotation-interval');
	var rotationToggle = document.getElementById('rotation-toggle');
	var socketURL = document.getElementById('socket-url');
	var socketSecret = document.getElementById('socket-secret');
	var socketToggle = document.getElementById('socket-toggle');
	var socketLastReport = document.getElementById('socket-last-report');

	function queryTabBoss (request) {
		return new Promise(
			(resolve, reject) => {
				chrome.runtime.sendMessage(request, (response) => {
					resolve(response);
				});
			}
		);
	};

	queryTabBoss({type: 'API', method: 'getTabBossState'}).then((state) => {

		if (state.tabCycleIsActive) rotationToggle.checked = true;
		if (state.webSocketIsActive) socketToggle.checked = true;
		rotationInterval.value = state.tabCycleIntervalSeconds;
		socketURL.value = state.webSocketURL || '';
		socketSecret.value = state.webSocketSecret || '';

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

	rotationToggle.onchange = (e) => {
		queryTabBoss({
			type: 'API',
			method: 'setTabCycleActive',
			props: {
				isActive: rotationToggle.checked
			}
		});
	};

	rotationInterval.onchange = (e) => {
		queryTabBoss({
			type: 'API',
			method: 'setTabCycleIntervalSeconds',
			props: {
				seconds: rotationInterval.value
			}
		});
	};

	socketURL.onchange = (e) => {
		queryTabBoss({
			type: 'API',
			method: 'setTabBossWebSocketURL',
			props: {
				webSocketURL: socketURL.value
			}
		});
	};

});
