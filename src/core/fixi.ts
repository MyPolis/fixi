export interface FixiConfig {
	trigger: Event;
	action: string;
	method: string;
	target: Element;
	swap: string | ((cfg: FixiConfig) => void | Promise<void>);
	body: FormData | null;
	drop: number | boolean;
	headers: Record<string, string>;
	abort: () => void;
	signal: AbortSignal;
	preventTrigger: boolean;
	transition?: (callback: () => void | Promise<void>) => {finished: Promise<void>};
	fetch: typeof fetch;
	confirm?: () => Promise<boolean>;
	response?: Response;
	text?: string;
}

export class Fixi {
	#observer: MutationObserver | null = null;
	#elementRequests = new WeakMap<Element, Set<FixiConfig>>();
	#boundElements = new WeakSet<Element>();

	start(): void {
		if (this.#observer) return;

		this.#observer = new MutationObserver((recs) => {
			recs.forEach((r) => r.type === "childList" && r.addedNodes.forEach((n) => this.process(n)));
		});

		document.addEventListener("fx:process", (evt) => this.process(evt.target as Node));

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => this.#initDOM());
		} else {
			this.#initDOM();
		}
	}

	#initDOM(): void {
		if (!this.#observer) return;
		this.#observer.observe(document.documentElement, {childList: true, subtree: true});
		this.process(document.body);
	}

	#send(elt: EventTarget, type: string, detail: Record<string, unknown>, bubbles: boolean = true): boolean {
		return elt.dispatchEvent(
			new CustomEvent("fx:" + type, {detail, cancelable: true, bubbles: bubbles, composed: true})
		);
	}

	#attr(elt: Element, name: string, defaultVal: string = ""): string {
		return elt.getAttribute(name) || defaultVal;
	}

	#isIgnored(elt: Element): boolean {
		return elt.closest("[fx-ignore]") != null;
	}

	process(n: Node): void {
		const el = n as Element;
		if (el.matches) {
			if (this.#isIgnored(el)) return;
			if (el.matches("[fx-action]")) this.#bindElement(el);
		}
		if (el.querySelectorAll) {
			el.querySelectorAll("[fx-action]").forEach((child) => this.#bindElement(child));
		}
	}

	#bindElement(elt: Element): void {
		const options: AddEventListenerOptions = {};

		if (this.#boundElements.has(elt) || this.#isIgnored(elt) || !this.#send(elt, "init", {options})) return;

		this.#boundElements.add(elt);
		this.#elementRequests.set(elt, new Set<FixiConfig>());

		// Setup indicator if present
		if (elt.hasAttribute("fx-indicator")) {
			const indicatorSelector = this.#attr(elt, "fx-indicator");
			const indicator = indicatorSelector === "" ? elt : document.querySelector(indicatorSelector);
			const indicatorClass = this.#attr(elt, "fx-indicator-class", "fx-requesting");
			const indicatorAttr = this.#attr(elt, "fx-indicator-attr");

			const setIndicator = (active: boolean, isError = false) => {
				if (indicatorClass && indicator) {
					indicator.classList.toggle(indicatorClass, active);
					indicator.classList.toggle("fx-error", isError);
				}
				if (indicatorAttr && indicator) {
					if (active) indicator.setAttribute(indicatorAttr, "");
					else indicator.removeAttribute(indicatorAttr);
				}
			};

			elt.addEventListener("fx:before", () => setIndicator(true));
			elt.addEventListener("fx:after", () => setIndicator(false));
			elt.addEventListener("fx:error", () => setIndicator(false, true));
			elt.addEventListener("fx:finally", () => setIndicator(false));
		}

		const handler = async (evt: Event) => {
			const reqs = this.#elementRequests.get(elt)!;

			const inputElt = elt as HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement;
			const form = inputElt.form || (elt.closest("form") as HTMLFormElement | null);
			const submitter = (evt as SubmitEvent).submitter;

			const body = new FormData(form ?? undefined, submitter);

			if (inputElt.name && !submitter && (!form || (inputElt.form === form && inputElt.type === "submit"))) {
				body.append(inputElt.name, inputElt.value);
			}

			const ac = new AbortController();
			const targetElt = document.querySelector<Element>(this.#attr(elt, "fx-target")) ?? elt;

			const cfg: FixiConfig = {
				trigger: evt,
				action: this.#attr(elt, "fx-action"),
				method: this.#attr(elt, "fx-method", "GET").toUpperCase(),
				target: targetElt,
				swap: this.#attr(elt, "fx-swap", "outerHTML"),
				body,
				drop: reqs.size,
				headers: {"FX-Request": "true"},
				abort: ac.abort.bind(ac),
				signal: ac.signal,
				preventTrigger: true,
				transition: document.startViewTransition?.bind(document),
				fetch: fetch.bind(window)
			};

			const go = this.#send(elt, "config", {cfg, requests: reqs});
			if (cfg.preventTrigger) evt.preventDefault();
			if (!go || cfg.drop) return;

			if (/GET|DELETE/.test(cfg.method)) {
				const params = new URLSearchParams();
				if (cfg.body) {
					cfg.body.forEach((value, key) => {
						params.append(key, value instanceof File ? value.name : value);
					});
				}

				if (params.size) {
					cfg.action += (/\?/.test(cfg.action) ? "&" : "?") + params.toString();
				}
				cfg.body = null;
			}

			reqs.add(cfg);

			try {
				if (cfg.confirm) {
					const result = await cfg.confirm();
					if (!result) return;
				}

				if (!this.#send(elt, "before", {cfg, requests: reqs})) return;

				const fetchInit: RequestInit = {
					method: cfg.method,
					headers: cfg.headers,
					signal: cfg.signal
				};
				if (cfg.body) fetchInit.body = cfg.body;

				cfg.response = await cfg.fetch(cfg.action, fetchInit);
				cfg.text = await cfg.response.text();

				if (!this.#send(elt, "after", {cfg})) return;
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				this.#send(elt, "error", {cfg, error: err});
				return;
			} finally {
				reqs.delete(cfg);
				this.#send(elt, "finally", {cfg});
			}

			const doSwap = async () => {
				if (typeof cfg.swap === "function") {
					return cfg.swap(cfg);
				} else if (typeof cfg.swap === "string" && /(before|after)(begin|end)/.test(cfg.swap)) {
					cfg.target.insertAdjacentHTML(cfg.swap as InsertPosition, cfg.text || "");
				} else if (typeof cfg.swap === "string" && cfg.swap in cfg.target) {
					Object.assign(cfg.target, {[cfg.swap]: cfg.text});
				} else if (cfg.swap !== "none") {
					throw new Error(`Invalid swap: ${cfg.swap}`);
				}
			};

			if (cfg.transition) {
				await cfg.transition(doSwap).finished;
			} else {
				await doSwap();
			}

			this.#send(elt, "swapped", {cfg});
			if (!document.contains(elt)) this.#send(document, "swapped", {cfg});
		};

		const evtType = this.#attr(
			elt,
			"fx-trigger",
			elt.matches("form")
				? "submit"
				: elt.matches("input:not([type=button]),select,textarea")
					? "change"
					: "click"
		);
		elt.addEventListener(evtType, handler, options);

		this.#send(elt, "inited", {}, false);
	}
}

export const fixi = new Fixi();
fixi.start();
