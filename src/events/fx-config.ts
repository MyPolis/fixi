import type {FixiConfig} from "../core/fixi.js";

export class FxConfigEvent extends Event {
	readonly cfg: FixiConfig;
	readonly requests: Set<FixiConfig>;

	constructor(cfg: FixiConfig, requests: Set<FixiConfig>) {
		super("fx:config", {
			bubbles: true,
			cancelable: true,
			composed: true
		});
		this.cfg = cfg;
		this.requests = requests;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:config": FxConfigEvent;
	}
}
