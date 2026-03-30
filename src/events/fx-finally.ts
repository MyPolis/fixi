import type {FixiConfig} from "../core/fixi.js";

export class FxFinallyEvent extends Event {
	readonly cfg: FixiConfig;

	constructor(cfg: FixiConfig) {
		super("fx:finally", {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		this.cfg = cfg;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:finally": FxFinallyEvent;
	}
}
