import { sha512 } from "js-sha512";
import axios, { AxiosInstance } from "axios";

import { Logger } from "./utils/logger";
import { sleep } from "./utils/sleep";

const AUTHENTICATION_RETRY_INTERVAL = 10 * 1000;

export class ModuleAuthentication {
	private axios: AxiosInstance;
	private authenticatedToken: string | null = null;

	constructor (
		public apiKey: string,
		public apiSecret: string,
		private logger: Logger,
		speakMasterAPIUrl: string = "http://localhost:3000/api/v1/"
	) {
		this.axios = axios.create({ baseURL: speakMasterAPIUrl });
	}

	public async getAuthenticatedToken (): Promise<string> {
		if (!this.authenticatedToken)
			await this._authenticateModule();

		while (!this.authenticatedToken) {
			await sleep(AUTHENTICATION_RETRY_INTERVAL);
			await this._authenticateModule();
		}

		return this.authenticatedToken;
	}

	public invalidateAuthenticatedToken (): void {
		this.authenticatedToken = null;
	}

	public async _authenticateModule (): Promise<boolean> {
		try {
			this.logger.log("Authenticating...");
			const response = await this.axios.post("modules/api/authentication", {
				apiKey: this.apiKey,
				apiSecret: sha512(this.apiSecret)
			});

			if (response.status !== 200) {
				this.logger.error("Authentication failed:", response.data);
				return false;
			}

			this.authenticatedToken = response.data.token;
			this.logger.log("Authenticated");

			const nextAuthentication = (response.data.expirationTime * 1000) - Date.now() - 60000;
			setTimeout(() => this._authenticateModule(), nextAuthentication);

			this.logger.log("Next authentication scheduled to", new Date(Date.now() + nextAuthentication).toLocaleString());
			return true;
		} catch (error: any) {
			this.logger.error("Authentication failed:", error.response?.data || error);
			return false;
		}
	}
}
