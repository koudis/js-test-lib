export default {

	redirectUri: 'https://appsmith.dev.bringautofleet.com/app/oauth2/webapioauth-65e351e6aba004506e0b4c62',
	issuerUrl: 'https://keycloak.bringauto.com/realms/bringauto',
	clientSecret: '',
	clientId: 'api.dev.bringautofleet.com',

	oauthClientParams: {
		client_id: this.clientId,
		client_secret: this.clientSecret,
		token_endpoint_auth_method: 'client_secret_basic',
	},

	async getDiscoveryObject() {
		const issuer = new URL(this.issuerUrl);
		return await index_js.discoveryRequest(issuer, { algorithm: 'oidc' })
			.then((response) => index_js.processDiscoveryResponse(issuer, response));
	},

	async getAutorizationUrl () {
		const code_challenge_method = 'S256';
		const as = await this.getDiscoveryObject();

		const code_verifier = index_js.generateRandomCodeVerifier();
		const code_challenge = await index_js.calculatePKCECodeChallenge(code_verifier);

		// redirect user to as.authorization_endpoint
		const authorizationUrl = new URL(as.authorization_endpoint);
		authorizationUrl.searchParams.set('client_id', this.clientId);;
		authorizationUrl.searchParams.set('redirect_uri', this.redirectUri);
		authorizationUrl.searchParams.set('response_type', 'code');
		authorizationUrl.searchParams.set('scope', 'openid profile email');
		authorizationUrl.searchParams.set('code_challenge', code_challenge);
		authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method);

		var nonce = index_js.generateRandomNonce();
		authorizationUrl.searchParams.set('nonce', nonce);

		//storeValue("oauth_nonce", nonce);
		//storeValue("oath_code_verifier", code_verifier);

		console.info("AuthorizationURL: " + authorizationUrl.toString());
		//Auth_URL.setText(authorizationUrl.toString());
		return authorizationUrl.toString();
	},

	async processAuthCode() {
		const as = await this.getDiscoveryObject();

		const currentUrl = new URL(appsmith.URL.fullPath);
		console.log(as);
		const params = index_js.validateAuthResponse(as, this.oauthClientParams, currentUrl);
		console.log(params);
		if (index_js.isOAuth2Error(params)) {
			console.error('validateAuthResponse failed. Error Response', params);
			throw new Error(); // Handle OAuth 2.0 redirect error
		}

		const code_verifier = appsmith.store.oath_code_verifier;
		const response = await index_js.authorizationCodeGrantRequest(
			as,
			this.oauthClientParams,
			params,
			this.redirectUri,
			code_verifier,
		);

		var challenges = index_js.parseWwwAuthenticateChallenges(response);
		if (challenges) {
			for (const challenge of challenges) {
				console.error('WWW-Authenticate Challenge', challenge);
			}
			throw new Error();
		}

		const nonce = appsmith.store.oauth_nonce;
		const result = await index_js.processAuthorizationCodeOpenIDResponse(as, this.oauthClientParams, response, nonce);
		if (index_js.isOAuth2Error(result)) {
			console.error('processAuthorizationCodeOpenIDResponse failed. Error Response', result);
			throw new Error(); // Handle OAuth 2.0 response body error
		}

		console.log('Access Token Response', result);

		// Clear storage to get rid of all leftovers and store token
		//clearStore();
		//storeValue("token", result);
	},

	async refreshAccessToken() {
		if(!appsmith.store.token) {
			throw new Error("cannot refresh non existent token!");
		}

		const refresh_token = appsmith.store.token['refresh_token'];
		const as            = await this.getDiscoveryObject();
		const response      = await index_js.refreshTokenGrantRequest(as, this.oauthClientParams, refresh_token)

		var challenges = index_js.parseWwwAuthenticateChallenges(response);
		if (challenges) {
			for (const challenge of challenges) {
				console.error('WWW-Authenticate Challenge', challenge)
			}
			throw new Error() // Handle WWW-Authenticate Challenges as needed
		}

		const result = await index_js.processRefreshTokenResponse(as, this.oauthClientParams, response)
		if (index_js.isOAuth2Error(result)) {
			console.error('Error Response', result)
			throw new Error() // Handle OAuth 2.0 response body error
		}

		console.log('Access Token Response', result);

		//
		// There is no need to clear storage in token refresh
		//
		//storeValue("token", result);
	},

}
