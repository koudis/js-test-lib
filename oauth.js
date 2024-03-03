
let oauthMinimumAccessTokenLifetimeInmS = 10 * 1000;
let oauthServerMaxResponseTimeInmS = 10 * 1000;

function init() {
	this.setUpRefreshTimers();
}

function setUpRefreshTimers() {
	const refreshTokenCallback = () => {
		if(!appsmith.store.token) {
			clearInterval('OAuthRefreshTimer');
			setInterval(refreshTokenCheckCallback, this.oauthMinimumAccessTokenLifetimeInmS, "OAuthRefreshCheckTimer");
			return;
		}
		console.log("TIMER: token refresh");
		OAuth2.refreshAccessToken();
	};
	const refreshTokenCheckCallback = () => {
		if(!appsmith.store.token) {
			console.log("TIMER: No token to refresh");
			return;
		}
		console.log("TIMER: token refresh - timer started");
		var period = this.computeAccessTokenRefreshPeriod(appsmith.store.token['expires_in']);
		console.info("TIME: refresh period " + period);
		clearInterval("OAuthRefreshCheckTimer");
		setInterval(refreshTokenCallback, period, "OAuthRefreshTimer");
	};

	// Lets refresh token to get maximum lifetime possible before conter starts.
	refreshTokenCallback();
}

function computeAccessTokenRefreshPeriod(expires_in) {
	if(!expires_in) {
		expires_in = this.oauthMinimumAccessTokenLifetimeInmS / 1000;
	}
	console.log("expiresIn arg: " + expires_in);
	return Math.max((expires_in * 1000 - this.oauthServerMaxResponseTimeInmS),										this.oauthMinimumAccessTokenLifetimeInmS);
}

const OAuth2 = {
	init,
	setUpRefreshTimers,
	computeAccessTokenRefreshPeriod,
}

