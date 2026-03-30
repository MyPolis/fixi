import type {FixiConfig} from "../core/fixi.js";

export class FxBeforeEvent extends Event {
	readonly cfg: FixiConfig;
	readonly requests: Set<FixiConfig>;

	constructor(cfg: FixiConfig, requests: Set<FixiConfig>) {
		super("fx:before", {
			bubbles: true,
			cancelable: true,
			composed: true,
		});
		this.cfg = cfg;
		this.requests = requests;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:before": FxBeforeEvent;
	}
}
