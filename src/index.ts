import { CommandCenter } from "./command-center";
import { ModuleAuthentication } from "./module-authentication";
import { CommandsHandler, FeatureCallback } from "./commands-handler";

import { Logger } from "./utils/logger";

export { FeatureCallback } from "./commands-handler";
export { IAmbiguityOption } from "./models/ambiguity-option";
export { IFeatureParameters } from "./models/feature-parameters";

export class ModuleConnection {
	private commandCenter: CommandCenter;
	private commandsHandler: CommandsHandler;
	private logger: Logger;
	private moduleAuthentication: ModuleAuthentication;

	constructor (apiKey: string, apiSecret: string, debugging: boolean = false, speakMasterAPIUrl: string = "http://localhost:3000/api/v1/") {
		this.logger = new Logger(debugging);
		this.commandsHandler = new CommandsHandler(this.logger);
		this.moduleAuthentication = new ModuleAuthentication(apiKey, apiSecret, this.logger, speakMasterAPIUrl);
		this.commandCenter = new CommandCenter(this.moduleAuthentication, this.commandsHandler, this.logger);

		this.commandCenter.connect();
	}

	public setDebugging (debugging: boolean): void {
		this.logger.debugging = debugging;
	}

	public registerFeature (featureIdentifier: string, handler: FeatureCallback): void {
		this.commandsHandler.registerFeature(featureIdentifier, handler);
	}
}
