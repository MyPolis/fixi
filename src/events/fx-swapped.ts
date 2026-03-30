import type {FixiConfig} from "../core/fixi.js";

export class FxSwappedEvent extends Event {
	readonly cfg: FixiConfig;

	constructor(cfg: FixiConfig) {
		super("fx:swapped", {
			bubbles: true,
			cancelable: true,
			composed: true
		});
		this.cfg = cfg;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:swapped": FxSwappedEvent;
	}
}
