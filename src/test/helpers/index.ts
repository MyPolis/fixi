/**
 * Test helpers for Fixi
 * Provides mocks for browser APIs that aren't available in Node.js/happy-dom
 */

import type {FxConfigEvent} from "../../events/fx-config.js";
import {Window} from "happy-dom";

// =============================================================================
// IntersectionObserver Mock
// =============================================================================

export let mockIntersectionCallbacks = new Map<Element, IntersectionObserverCallback>();
export let mockIntersectionObservers = new Map<Element, {threshold: number; rootMargin: string}>();

export class MockIntersectionObserver implements IntersectionObserver {
	root: Element | Document | null = null;
	rootMargin: string = "0px";
	scrollMargin: string = "0px";
	thresholds: readonly number[] = [0];

	constructor(
		private callback: IntersectionObserverCallback,
		private options?: IntersectionObserverInit
	) {
		this.rootMargin = options?.rootMargin || "0px";
		this.scrollMargin = options?.rootMargin || "0px";
		this.thresholds = options?.threshold !== undefined ? [options.threshold as number] : [0];
	}

	observe(target: Element): void {
		mockIntersectionCallbacks.set(target, this.callback);
		mockIntersectionObservers.set(target, {
			threshold: (this.options?.threshold as number) || 0,
			rootMargin: this.options?.rootMargin || "0px"
		});
	}

	unobserve(target: Element): void {
		mockIntersectionCallbacks.delete(target);
		mockIntersectionObservers.delete(target);
	}

	disconnect(): void {
		mockIntersectionCallbacks.clear();
		mockIntersectionObservers.clear();
	}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

/**
 * Simulate an intersection event for testing
 */
export function simulateIntersection(target: Element, isIntersecting: boolean = true) {
	const callback = mockIntersectionCallbacks.get(target);
	if (callback) {
		callback([{isIntersecting, target} as IntersectionObserverEntry], new MockIntersectionObserver(callback));
	}
}

/**
 * Clear all intersection observer mocks
 */
export function clearIntersectionMocks() {
	mockIntersectionCallbacks.clear();
	mockIntersectionObservers.clear();
}

// =============================================================================
// Fetch Mock
// =============================================================================

/**
 * Create a mock fetch function that returns a text response
 */
export function mockFetch(response: string, trackCalls?: {calls: string[]}) {
	return async (url: string | URL | Request) => {
		const urlString = typeof url === "string" ? url : url.toString();
		if (trackCalls) {
			trackCalls.calls.push(urlString);
		}
		return new Response(response);
	};
}

// =============================================================================
// DOM Setup Helper
// =============================================================================

/**
 * Setup global DOM environment using happy-dom
 * Must be called BEFORE importing Fixi
 */
export function setupDOM() {
	const window = new Window();

	(globalThis as any).window = window;
	(globalThis as any).document = window.document;
	(globalThis as any).MutationObserver = window.MutationObserver;
	(globalThis as any).CustomEvent = window.CustomEvent;
	(globalThis as any).fetch = window.fetch;
	(globalThis as any).Event = window.Event;
	(globalThis as any).IntersectionObserver = MockIntersectionObserver;

	return window;
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Clear document body and all mocks between tests
 */
export function cleanupTest() {
	if (typeof document !== "undefined") {
		document.body.innerHTML = "";
	}
	clearIntersectionMocks();
}

/**
 * Helper to inject mock fetch via fx:config event
 */
export function injectMockFetch(element: Element, response: string, trackCalls?: {calls: string[]}) {
	element.addEventListener("fx:config", (e: Event) => {
		(e as FxConfigEvent).cfg.fetch = mockFetch(response, trackCalls);
	});
}
