import { IAmbiguityOption } from "./ambiguity-option";
import { IFeatureParameters } from "./feature-parameters";

export interface IAmbiguity {
	parameters: IFeatureParameters;
	options: IAmbiguityOption[];
}
