class TabBoss {

	defaultState () {
		return {
			enableOnStartup: false,
			tabCycleIntervalSeconds: 10,
			tabCycleIsActive: false
		};
	}

	initialize () {
		this.state = {
			initialized: false
		};
		this.tabCycleIntervalID = null;
		this.initPromise = this.getLocalConfig();
		this.watchPopups();
		let that = this;
		this.initPromise.then((localStorage) => {
			that.setState(Object.assign(that.defaultState(), localStorage.tabBossConfig, {initialized: true}));
			this.exposeAPI();
			if (this.state.webSocketURL) {
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
		if (this.state.webSocketURL && newState.webSocketURL != oldState.webSocketURL) {
			this.connectWebSocket()
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
		let persistentAttributes = ['enableOnStartup', 'tabCycleIntervalSeconds', 'webSocketURL'];
		let newConfig = {};
		persistentAttributes.forEach((attr) => {
			newConfig[attr] = this.state[attr];
		});
		chrome.storage.sync.set({tabBossConfig: newConfig});
	}

	connectWebSocket () {
		if (this.webSocket) this.webSocket.close();
		this.webSocket = new WebSocket(this.state.webSocketURL);
		this.webSocket.onmessage = this.pushTabNotification;
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

			if (request.type != 'API') return false;

			if (request.method == 'getTabBossState') {
				sendResponse(this.state);

			} else if (request.method == 'setTabCycleActive') {
				tabBoss.setState({tabCycleIsActive: request.props.isActive});
				sendResponse(this.state.tabCycleIsActive);

			} else if (request.method == 'setTabCycleIntervalSeconds') {
				let seconds = request.props.seconds;
				tabBoss.setState({tabCycleIntervalSeconds: parseInt(seconds)});
				sendResponse(this.state.tabCycleIntervalSeconds)

			} else if (request.method == 'setTabBossWebSocketURL') {
				tabBoss.setState({webSocketURL: request.props.webSocketURL});
				sendResponse(this.state.webSocketURL);
			}
		});
	}

}

document.addEventListener('DOMContentLoaded', () => {
	var tabBoss = window.tabBoss = new TabBoss();
	tabBoss.initialize();
});
