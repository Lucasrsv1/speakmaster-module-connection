import { IFeatureParameters } from "./feature-parameters";

export interface IAmbiguityOption {
	description: string;
	value: IFeatureParameters;
	image?: string;
	secondaryInfo?: string;
}
