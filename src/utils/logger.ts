export class Logger {
	public debugging: boolean;

	constructor (debugging: boolean = false) {
		this.debugging = debugging;
	}

	public error (...params: any): void {
		if (this.debugging)
			console.error(...params);
	}

	public info (...params: any): void {
		if (this.debugging)
			console.info(...params);
	}

	public log (...params: any): void {
		if (this.debugging)
			console.log(...params);
	}

	public warn (...params: any): void {
		if (this.debugging)
			console.warn(...params);
	}
}
