import { EventEmitter } from "events";

import {
	ActionButtonPreference,
	Preference,
	PreferenceType,
	PreferenceValue,
	SelectOption,
	SingleSelectPreference,
	SortedListPreference
} from "speakmaster-module-builder/preferences-builder";

import { Logger } from "./utils/logger";

export interface IPreferenceUpdate {
	identifier: string;
	isDisabled: boolean;
	value: PreferenceValue;
	buttonIcon?: string | null;
	buttonText?: string;
	label?: string | null;
	list?: SelectOption<PreferenceValue>[];
	options?: SelectOption<PreferenceValue>[];
}

export class PreferencesMonitor {
	private monitoring: boolean;
	private registeredPreferences: Map<string, Preference<PreferenceValue>>;

	public readonly onChange: EventEmitter<{ event: [IPreferenceUpdate | IPreferenceUpdate[]] }>;

	constructor (private logger: Logger) {
		this.monitoring = false;
		this.registeredPreferences = new Map<string, Preference<PreferenceValue>>();
		this.onChange = new EventEmitter();
	}

	public startMonitoring (): void {
		this.monitoring = true;
		const preferenceUpdates: IPreferenceUpdate[] = [];
		for (const preference of this.registeredPreferences.values())
			preferenceUpdates.push(this.getPreferenceUpdate(preference));

		this.onChange.emit("event", preferenceUpdates);
	}

	public stopMonitoring (): void {
		this.monitoring = false;
	}

	public updatePreferenceValue (identifier: string, value: PreferenceValue): void {
		if (!this.registeredPreferences.has(identifier)) {
			this.logger.error(`Preference ${identifier} not registered`);
			return;
		}

		this.registeredPreferences.get(identifier)!.value = value;
	}

	public registerPreference (preference: Preference<PreferenceValue>): void {
		if (this.registeredPreferences.has(preference.identifier))
			throw new Error(`Preference ${preference.identifier} already registered`);

		this.registeredPreferences.set(preference.identifier, preference);
		preference.changes.on("any", this.preferenceChanged.bind(this, preference.identifier));
	}

	public preferenceChanged (identifier: string): void {
		if (!this.monitoring)
			return;

		const preference = this.registeredPreferences.get(identifier);
		if (!preference)
			throw new Error(`Preference ${identifier} is not registered anymore`);

		const changeUpdate = this.getPreferenceUpdate(preference);
		this.logger.log("Preference changed:", changeUpdate);
		this.onChange.emit("event", changeUpdate);
	}

	public getPreferenceUpdate (preference: Preference<PreferenceValue>): IPreferenceUpdate {
		const changeUpdate: IPreferenceUpdate = {
			identifier: preference.identifier,
			isDisabled: preference.isDisabled,
			value: preference.value
		};

		switch (preference.type) {
			case PreferenceType.ACTION_BUTTON:
				changeUpdate.buttonIcon = (preference as ActionButtonPreference<PreferenceValue>).buttonIcon;
				changeUpdate.buttonText = (preference as ActionButtonPreference<PreferenceValue>).buttonText;
				changeUpdate.label = (preference as ActionButtonPreference<PreferenceValue>).label;
				break;
			case PreferenceType.MULTI_SELECT:
			case PreferenceType.SINGLE_SELECT:
				changeUpdate.options = (preference as SingleSelectPreference<PreferenceValue>).options;
				break;
			case PreferenceType.SORTED_LIST:
				changeUpdate.list = (preference as SortedListPreference<PreferenceValue>).list;
				break;
		}

		return changeUpdate;
	}
}
