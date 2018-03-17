document.addEventListener('DOMContentLoaded', () => {

	var dropdown = document.getElementById('dropdown');
	var checkbox = document.getElementById('checkbox');
	var number = document.getElementById('number');
	var text = document.getElementById('text');
	var activeTab = null;
	var allTabs = null;
	var bg = chrome.extension.getBackgroundPage();

	function tabBossAPI (request) {
		return new Promise(
			(resolve, reject) => {
				chrome.runtime.sendMessage(request, (response) => {
					resolve(response);
				});
			}
		);
	};

	tabBossAPI({method: 'getTabBossState'}).then((state) => {

		if (state.tabCycleIsActive) checkbox.checked = true;
		number.value = state.tabCycleIntervalSeconds;
		text.value = state.webSocketURL;

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
				dropdown.appendChild(option);
			});
		});

		dropdown.onchange = (e) => {
			chrome.tabs.update(parseInt(dropdown.value), {active: true});
		};

		checkbox.onchange = (e) => {
			tabBossAPI({
				method: 'setTabCycleActive',
				props: {
					isActive: checkbox.checked
				}
			});
		};

		number.onchange = (e) => {
			tabBossAPI({
				method: 'setTabCycleIntervalSeconds',
				props: {
					seconds: number.value
				}
			});
		};

		text.onchange = (e) => {
			tabBossAPI({
				method: 'setTabBossWebSocketURL',
				props: {
					webSocketURL: text.value
				}
			});
		};

	});

});
