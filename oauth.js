
export let oauthMinimumAccessTokenLifetimeInmS = 10 * 1000;
export let oauthServerMaxResponseTimeInmS = 10 * 1000;

export async function init() {
	this.setUpRefreshTimers();
}

function OAuth() {
	console.log("Called");
}

export function setUpRefreshTimers() {
	const refreshTokenCallback = () => {
		if(!appsmith.store.token) {
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
	};

	// Lets refresh token to get maximum lifetime possible before conter starts.
	refreshTokenCallback();
	refreshTokenCheckCallback();
}

export function computeAccessTokenRefreshPeriod(expires_in) {
	if(!expires_in) {
		expires_in = this.oauthMinimumAccessTokenLifetimeInmS / 1000;
	}
	console.log("expiresIn arg: " + expires_in);
	return Math.max((expires_in * 1000 - this.oauthServerMaxResponseTimeInmS),										this.oauthMinimumAccessTokenLifetimeInmS);
}
