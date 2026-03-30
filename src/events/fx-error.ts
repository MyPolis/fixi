import type {FixiConfig} from "../core/fixi.js";

export class FxErrorEvent extends Event {
	readonly cfg: FixiConfig;
	readonly error: Error;

	constructor(cfg: FixiConfig, error: Error) {
		super("fx:error", {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		this.cfg = cfg;
		this.error = error;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:error": FxErrorEvent;
	}
}
