import { createConnection, Socket } from "net";

import { CommandsHandler } from "./commands-handler";
import { ModuleAuthentication } from "./module-authentication";
import { PreferencesMonitor } from "./preferences-monitor";

import { Logger } from "./utils/logger";
import { sleep } from "./utils/sleep";

enum CommandCenterEvents {
	AUTHENTICATION = "AUTHENTICATION",
	COMMAND = "COMMAND",
	COMMAND_RESULT = "COMMAND_RESULT",
	MESSAGE = "MESSAGE",
	PREFERENCE_DYNAMIC_CHANGE = "PREFERENCE_DYNAMIC_CHANGE",
	PREFERENCE_VALUE_UPDATE = "PREFERENCE_VALUE_UPDATE",
	PREFERENCE_WATCH = "PREFERENCE_WATCH"
}

const RECONNECTION_INTERVAL = 5000;

export class CommandCenter {
	private host: string = "localhost";
	private port: number = 2213;
	private client?: Socket;

	constructor (
		public commandsHandler: CommandsHandler,
		public moduleAuthentication: ModuleAuthentication,
		public preferencesMonitor: PreferencesMonitor,
		private logger: Logger
	) {
		this.preferencesMonitor.onChange.on("event", data => {
			this.send(CommandCenterEvents.PREFERENCE_DYNAMIC_CHANGE, data);
		});
	}

	public connect (): void {
		this.logger.log("Connecting to command center...");

		this.client = createConnection(this.port, this.host, async () => {
			this.logger.log("Connected to command center");

			// Authenticate module
			this.send(CommandCenterEvents.AUTHENTICATION, {
				token: await this.moduleAuthentication.getAuthenticatedToken()
			});
		});

		this.client.on("data", data => {
			this.logger.log("Received from command center:", data.toString());

			try {
				this.handleResponse(JSON.parse(data.toString()));
			} catch (error) {
				this.logger.error(error);
			}
		});

		this.client.on("error", error => {
			this.logger.error(error);
		});

		this.client.on("close", async () => {
			this.logger.log("Disconnected from command center");

			await sleep(RECONNECTION_INTERVAL);
			this.connect();
		});
	}

	private send (event: CommandCenterEvents, data: Record<string, any>): void {
		data.event = event;
		this.client?.write(JSON.stringify(data));
	}

	private async handleResponse (data: Record<string, any>): Promise<void> {
		switch (data.event) {
			case CommandCenterEvents.AUTHENTICATION:
				if (!data.success) {
					this.logger.error("Authentication failed:", data);

					this.moduleAuthentication.invalidateAuthenticatedToken();
					this.client?.end();
				} else {
					this.logger.log("Authentication succeeded");
				}
				break;
			case CommandCenterEvents.COMMAND:
				// eslint-disable-next-line no-case-declarations
				const commandExecutionResult = await this.commandsHandler.onCommandReceived(data.featureIdentifier, data.parameters);
				this.send(CommandCenterEvents.COMMAND_RESULT, {
					featureIdentifier: data.featureIdentifier,
					sentAt: data.sentAt,
					result: commandExecutionResult
				});
				break;
			case CommandCenterEvents.MESSAGE:
				this.logger.log(data.message);
				break;
			case CommandCenterEvents.PREFERENCE_WATCH:
				if (data.subscribe)
					this.preferencesMonitor.startMonitoring();
				else
					this.preferencesMonitor.stopMonitoring();
				break;
			case CommandCenterEvents.PREFERENCE_VALUE_UPDATE:
				for (const preference of data.preferences)
					this.preferencesMonitor.updatePreferenceValue(preference.identifier, preference.value);
				break;
			default:
				this.logger.warn("Unknown event:", data.event);
		}
	}
}
