export class FxInitedEvent extends Event {
	constructor() {
		super("fx:inited", {
			bubbles: false,
			cancelable: true,
			composed: true
		});
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:inited": FxInitedEvent;
	}
}
