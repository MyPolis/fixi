import {FxInitEvent} from "../events/fx-init.js";
import {FxInitedEvent} from "../events/fx-inited.js";
import {FxConfigEvent} from "../events/fx-config.js";
import {FxBeforeEvent} from "../events/fx-before.js";
import {FxAfterEvent} from "../events/fx-after.js";
import {FxErrorEvent} from "../events/fx-error.js";
import {FxFinallyEvent} from "../events/fx-finally.js";
import {FxSwappedEvent} from "../events/fx-swapped.js";

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
	#intersectionObservers = new WeakMap<Element, IntersectionObserver>();

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

	#attr(elt: Element, name: string, defaultVal: string = ""): string {
		return elt.getAttribute(name) || defaultVal;
	}

	#parseDuration(str: string): number {
		// Parse duration strings like "300", "300ms", "0.5s"
		const match = str.match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/);
		if (!match) return 0;
		const val = parseFloat(match[1]);
		const unit = match[2] || "ms";
		return unit === "s" ? val * 1000 : val;
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

		if (this.#boundElements.has(elt) || this.#isIgnored(elt) || !elt.dispatchEvent(new FxInitEvent(options)))
			return;

		this.#boundElements.add(elt);
		this.#elementRequests.set(elt, new Set<FixiConfig>());

		// Setup indicator if present
		if (elt.hasAttribute("fx-indicator")) {
			const indicatorSelector = this.#attr(elt, "fx-indicator");
			const indicator = indicatorSelector === "" ? elt : document.querySelector(indicatorSelector);
			const indicatorClass = this.#attr(elt, "fx-indicator-class", "fx-requesting");
			const indicatorAttrs = this.#attr(elt, "fx-indicator-attr")
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s);

			const setIndicator = (active: boolean, isError = false) => {
				if (indicatorClass && indicator) {
					indicator.classList.toggle(indicatorClass, active);
					indicator.classList.toggle("fx-error", isError);
				}
				if (indicatorAttrs.length > 0 && indicator) {
					indicatorAttrs.forEach((attr) => {
						if (active) indicator.setAttribute(attr, "");
						else indicator.removeAttribute(attr);
					});
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

			const go = elt.dispatchEvent(new FxConfigEvent(cfg, reqs));
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

				if (!elt.dispatchEvent(new FxBeforeEvent(cfg, reqs))) return;

				const fetchInit: RequestInit = {
					method: cfg.method,
					headers: cfg.headers,
					signal: cfg.signal
				};
				if (cfg.body) fetchInit.body = cfg.body;

				cfg.response = await cfg.fetch(cfg.action, fetchInit);
				cfg.text = await cfg.response.text();

				if (!elt.dispatchEvent(new FxAfterEvent(cfg))) return;
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));
				elt.dispatchEvent(new FxErrorEvent(cfg, err));
				return;
			} finally {
				reqs.delete(cfg);
				elt.dispatchEvent(new FxFinallyEvent(cfg));
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

			elt.dispatchEvent(new FxSwappedEvent(cfg));
			if (!document.contains(elt)) document.dispatchEvent(new FxSwappedEvent(cfg));
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

		// Handle intersection observer for "intersect" trigger
		if (evtType === "intersect") {
			const threshold = parseFloat(this.#attr(elt, "fx-intersect-threshold", "0"));
			const rootMargin = this.#attr(elt, "fx-intersect-root-margin", "0px");

			const obs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							obs.unobserve(elt);
							this.#intersectionObservers.delete(elt);
							handler(new Event("intersect"));
							return;
						}
					}
				},
				{
					threshold: isNaN(threshold) ? 0 : threshold,
					rootMargin: rootMargin
				}
			);

			this.#intersectionObservers.set(elt, obs);
			obs.observe(elt);
		} else {
			// Normal event listener with optional debounce/throttle
			const debounceMs = this.#parseDuration(this.#attr(elt, "fx-debounce", "0"));
			const throttleMs = this.#parseDuration(this.#attr(elt, "fx-throttle", "0"));

			let wrappedHandler: typeof handler = handler;

			if (debounceMs > 0) {
				// Debounce: wait for delay after last event (trailing edge)
				// New events abort any in-flight request from this element
				let timer: ReturnType<typeof setTimeout> | null = null;
				const elementReqs = this.#elementRequests.get(elt)!;
				wrappedHandler = async (evt: Event) => {
					// Abort any in-flight request from previous debounce
					for (const cfg of elementReqs) {
						cfg.abort();
						elementReqs.delete(cfg);
					}
					if (timer) clearTimeout(timer);
					timer = setTimeout(() => handler(evt), debounceMs);
				};
			} else if (throttleMs > 0) {
				// Throttle: limit to once per period (trailing edge)
				// New events that trigger requests abort any in-flight ones
				let lastTime = 0;
				let timer: ReturnType<typeof setTimeout> | null = null;
				const elementReqs = this.#elementRequests.get(elt)!;
				const abortPending = () => {
					for (const cfg of elementReqs) {
						cfg.abort();
						elementReqs.delete(cfg);
					}
				};
				wrappedHandler = async (evt: Event) => {
					const now = Date.now();
					const remaining = throttleMs - (now - lastTime);
					if (remaining <= 0) {
						// Enough time has passed, execute immediately
						abortPending();
						lastTime = now;
						handler(evt);
					} else if (!timer) {
						// Schedule execution at end of throttle period
						timer = setTimeout(() => {
							abortPending();
							lastTime = Date.now();
							timer = null;
							handler(evt);
						}, remaining);
					}
					// If timer already set, drop this event
				};
			}

			elt.addEventListener(evtType, wrappedHandler, options);
		}

		elt.dispatchEvent(new FxInitedEvent());
	}
}

export const fixi = new Fixi();
fixi.start();
