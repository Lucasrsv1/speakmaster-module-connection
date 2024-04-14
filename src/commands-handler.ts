import { IAmbiguity } from "./models/ambiguity";
import { IAmbiguityOption } from "./models/ambiguity-option";
import { IFeatureParameters } from "./models/feature-parameters";

import { Logger } from "./utils/logger";

export type FeatureCallback = (parameters?: IFeatureParameters) => Promise<IAmbiguityOption[] | boolean> | IAmbiguityOption[] | boolean;

export class CommandsHandler {
	private registeredFeatures: Map<string, FeatureCallback>;

	constructor (private logger: Logger) {
		this.registeredFeatures = new Map<string, FeatureCallback>();
	}

	public async onCommandReceived (featureIdentifier: string, parameters: IFeatureParameters): Promise<IAmbiguity | boolean> {
		this.logger.log("Received command:", featureIdentifier, parameters);

		if (!this.registeredFeatures.has(featureIdentifier)) {
			console.error(`Feature ${featureIdentifier} not registered`);
			return false;
		}

		const handler = this.registeredFeatures.get(featureIdentifier)!;
		const ambiguityOptions = await handler(parameters || {});

		if (Array.isArray(ambiguityOptions))
			return { parameters, options: ambiguityOptions };

		return ambiguityOptions;
	}

	public registerFeature (featureIdentifier: string, handler: FeatureCallback): void {
		if (this.registeredFeatures.has(featureIdentifier))
			throw new Error(`Feature ${featureIdentifier} already registered`);

		this.registeredFeatures.set(featureIdentifier, handler);
	}
}
