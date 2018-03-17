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
		let that = this;
		this.initPromise.then((localStorage) => {
			that.setState(Object.assign(that.defaultState(), localStorage.tabBossConfig, {initialized: true}));
		});
		this.exposeAPI();
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
		if ('tabCycleIsActive' in newState && newState.tabCycleIsActive != oldState.tabCycleIsActive) {
			if (newState.tabCycleIsActive) {
				this.startTabCycle();
			} else {
				this.stopTabCycle();
			}
		} else if (this.state.tabCycleIsActive && newState.tabCycleIntervalSeconds && newState.tabCycleIntervalSeconds != oldState.tabCycleIntervalSeconds) {
			this.restartTabCycle()
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
		let persistentAttributes = ['enableOnStartup', 'tabCycleIntervalSeconds'];
		let newConfig = {};
		persistentAttributes.forEach((attr) => {
			newConfig[attr] = this.state[attr];
		});
		chrome.storage.sync.set({tabBossConfig: newConfig});
	}

	// Tab Boss API

	exposeAPI () {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.method == 'getTabBossState') {
					sendResponse(this.state);
			} else if (request.method == 'setTabCycleActive') {
					tabBoss.setState({tabCycleIsActive: request.props.isActive});
					sendResponse(this.state.tabCycleIsActive);
			} else if (request.method == 'setTabCycleIntervalSeconds') {
					let seconds = request.props.seconds;
					tabBoss.setState({tabCycleIntervalSeconds: parseInt(seconds)});
					sendResponse(this.state.tabCycleIntervalSeconds)
				}
		});
	}

}

document.addEventListener('DOMContentLoaded', () => {
	var tabBoss = window.tabBoss = new TabBoss();
	tabBoss.initialize();
});
