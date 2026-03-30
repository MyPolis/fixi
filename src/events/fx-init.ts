export class FxInitEvent extends Event {
	readonly options: AddEventListenerOptions;

	constructor(options: AddEventListenerOptions) {
		super("fx:init", {
			bubbles: true,
			cancelable: true,
			composed: true
		});
		this.options = options;
	}
}

declare global {
	interface GlobalEventHandlersEventMap {
		"fx:init": FxInitEvent;
	}
}
