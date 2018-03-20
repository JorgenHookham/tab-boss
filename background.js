class TabBoss {

	defaultState () {
		return {
			enableOnStartup: false,
			tabCycleIntervalSeconds: 10,
			tabCycleIsActive: false,
			webSocketIsActive: false
		};
	}

	initialize () {
		this.state = {
			initialized: false
		};
		this.tabCycleIntervalID = null;
		this.initPromise = this.getLocalConfig();
		this.watchPopups();
		this.initPromise.then((localStorage) => {
			this.setState(Object.assign(this.defaultState(), localStorage.tabBossConfig, {initialized: true}));
			this.exposeAPI();
			if (this.isSocketConfigured()) {
				this.connectWebSocket();
			}
		});
		return this.initPromise;
	}

	startTabCycle () {

		this.tabCycleIntervalID = setInterval(() => {

			chrome.tabs.getAllInWindow(null, (tabs) => {

				chrome.tabs.getSelected(null, (tab) => {

					let nextIndex = tab.index + 1 < tabs.length ? tab.index + 1 : 0;

					tabs.forEach((tab) => {
						if (tab.index == nextIndex) {
							chrome.tabs.update(tab.id, {active: true});
						}
					});
				});
			});
		}, this.state.tabCycleIntervalSeconds * 1000);
	}

	stopTabCycle () {
		clearInterval(this.tabCycleIntervalID);
	}

	restartTabCycle () {
		this.stopTabCycle();
		this.startTabCycle();
	}

	setState (newState) {
		let oldState = Object.assign({}, this.state);
		this.state = Object.assign(this.state, newState);
		this.stateDidChange(this.state, oldState);
		return this.state, oldState;
	}

	stateDidChange (newState, oldState) {
		if (this.isSocketConfigured()) {
			this.connectWebSocket();
		} else if (this.webSocket) {
			this.disconnectWebSocket()
		}
		this.setLocalConfig();
	}

	getLocalConfig () {
		let configGetPromise = new Promise(
			(resolve, reject) => {
				chrome.storage.sync.get(['tabBossConfig'], (localStorage) => {
					let err = chrome.runtime.lastError;
					if (err) reject(err);
					else resolve(localStorage);
				})
			}
		);
		return configGetPromise;
	}

	setLocalConfig () {
		let persistentAttributes = ['enableOnStartup', 'tabCycleIntervalSeconds', 'webSocketURL', 'webSocketSecret', 'webSocketIsActive'];
		let newConfig = {};
		persistentAttributes.forEach((attr) => {
			newConfig[attr] = this.state[attr];
		});
		chrome.storage.sync.set({tabBossConfig: newConfig});
	}

	isSocketConfigured () {
		return this.state.webSocketURL && this.state.webSocketSecret && this.state.webSocketIsActive;
	}

	connectWebSocket () {
		if (this.webSocket) this.disconnectWebSocket();
		this.webSocket = new WebSocket(this.state.webSocketURL);
		this.webSocket.onmessage = this.pushTabNotification;
		console.log(this.webSocket)
	}

	disconnectWebSocket () {
		this.webSocket.close();
		this.webSocket = null;
	}

	watchPopups () {
		var that = this;
		chrome.runtime.onConnect.addListener((port) => {
			that.stopTabCycle();
			port.onDisconnect.addListener(() => {
				if (that.state.tabCycleIsActive) {
					that.startTabCycle();
					that.connectWebSocket();
				}
			});
		});
	}

	pushTabNotification (message)  {
		chrome.tabs.getSelected(null, (tab) => {
			chrome.tabs.sendMessage(tab.id, {
				type: 'sound'
			});
		});
		chrome.tabs.getAllInWindow(null, (tabs) => {
			tabs.forEach((tab) => {
				chrome.tabs.sendMessage(tab.id, {
					type: 'notification',
					message: message.data
				})
			});
		});
	}

	// Tab Boss API

	exposeAPI () {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.type == 'API') {
				if (request.method == 'get') {
				sendResponse(this.state);
				} else if (request.method == 'set') {
					tabBoss.setState(request.data);
					sendResponse(this.state);
				}
			}
		});
	}

}

document.addEventListener('DOMContentLoaded', () => {
	var tabBoss = window.tabBoss = new TabBoss();
	tabBoss.initialize();
});
