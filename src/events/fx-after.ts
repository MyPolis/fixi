import type {FixiConfig} from "../core/fixi.js";

export class FxAfterEvent extends Event {
	readonly cfg: FixiConfig;

	constructor(cfg: FixiConfig) {
		super("fx:after", {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		this.cfg = cfg;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:after": FxAfterEvent;
	}
}
