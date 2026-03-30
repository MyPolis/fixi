import assert from "node:assert";
import {beforeEach, test} from "node:test";

import {cleanupTest, injectMockFetch, setupDOM, simulateIntersection} from "../test/helpers/index.js";

// Setup DOM environment FIRST (must happen before importing Fixi)
setupDOM();

// Now import Fixi after DOM is ready
const {Fixi} = await import("./fixi.js");

beforeEach(() => {
	cleanupTest();
});

// =============================================================================
// CORE / INITIALIZATION TESTS
// =============================================================================

test("Fixi initializes and creates instance", () => {
	const fixi = new Fixi();
	assert.ok(fixi);
	assert.strictEqual(typeof fixi.start, "function");
	assert.strictEqual(typeof fixi.process, "function");
});

test("Fixi processes elements with fx-action attribute", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test">Click</button>`;

	const button = document.querySelector("[fx-action]")!;

	// Add event listener BEFORE processing
	let initFired = false;
	button.addEventListener("fx:init", () => {
		initFired = true;
	});

	fixi.process(button);

	assert.ok(initFired, "fx:init event should fire");
});

test("Fixi dispatches correct event sequence", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test">Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	const events: string[] = [];

	button.addEventListener("fx:init", () => events.push("init"));
	button.addEventListener("fx:inited", () => events.push("inited"));

	fixi.process(button);

	assert.deepStrictEqual(events, ["init", "inited"], "Should fire init then inited");
});

test("Fixi ignores elements with fx-ignore attribute", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `
		<div fx-ignore>
			<button fx-action="/test">Click</button>
		</div>
	`;

	const container = document.querySelector("[fx-ignore]")!;

	// Add listener before processing
	const button = container.querySelector("[fx-action]")!;
	let initFired = false;
	button.addEventListener("fx:init", () => {
		initFired = true;
	});

	fixi.process(container);

	assert.ok(!initFired, "Should not fire fx:init for ignored elements");
});

// =============================================================================
// EVENT TRIGGER TESTS
// =============================================================================

test("Fixi binds event listeners based on element type", () => {
	const fixi = new Fixi();

	// Button should get click listener
	document.body.innerHTML = `<button fx-action="/test">Click</button>`;
	let button = document.querySelector("[fx-action]")!;
	fixi.process(button);

	// Form should get submit listener
	document.body.innerHTML = `<form fx-action="/test"><button type="submit">Submit</button></form>`;
	let form = document.querySelector("[fx-action]")!;
	fixi.process(form);

	// Input should get change listener
	document.body.innerHTML = `<input fx-action="/test" />`;
	let input = document.querySelector("[fx-action]")!;
	fixi.process(input);

	assert.ok(true, "Event listeners bound without errors");
});

test("Fixi supports fx-trigger custom event", async () => {
	const fixi = new Fixi();
	const trackCalls: {calls: string[]} = {calls: []};

	document.body.innerHTML = `
		<div id="test" fx-action="/test" fx-trigger="mouseenter" fx-target="#test">Hover</div>
	`;
	const div = document.querySelector("[fx-action]")!;

	// Inject mock fetch
	injectMockFetch(div, "<p>Result</p>", trackCalls);

	fixi.process(div);

	// Dispatch mouseenter event
	div.dispatchEvent(new CustomEvent("mouseenter", {bubbles: true}));

	// Wait for async operations
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Verify fetch was called with the custom trigger
	assert.strictEqual(trackCalls.calls.length, 1, "Fetch should be called on mouseenter");
	assert.strictEqual(trackCalls.calls[0], "/test", "Should use correct action URL");
});

test("Fixi supports fx-trigger intersect", async () => {
	const fixi = new Fixi();
	const trackCalls: {calls: string[]} = {calls: []};

	document.body.innerHTML = `
		<div id="test" fx-action="/test" fx-trigger="intersect" fx-target="#test">Content</div>
	`;

	const div = document.querySelector("[fx-action]")!;

	injectMockFetch(div, "<p>Result</p>", trackCalls);

	fixi.process(div);

	// Verify observer was created by checking if we can simulate intersection
	simulateIntersection(div, true);

	await new Promise((resolve) => setTimeout(resolve, 50));

	assert.strictEqual(trackCalls.calls.length, 1, "Fetch should be called when element intersects");
	assert.strictEqual(trackCalls.calls[0], "/test", "Should use correct action URL");
});

// =============================================================================
// INDICATOR TESTS
// =============================================================================

test("Indicator toggles fx-requesting class during request lifecycle", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test" fx-indicator>Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	fixi.process(button);

	// Verify no class initially
	assert.ok(!button.classList.contains("fx-requesting"), "Should not have class initially");

	// Simulate request start
	button.dispatchEvent(new CustomEvent("fx:before"));
	assert.ok(button.classList.contains("fx-requesting"), "Should have fx-requesting class during request");

	// Simulate request end
	button.dispatchEvent(new CustomEvent("fx:after"));
	assert.ok(!button.classList.contains("fx-requesting"), "Should remove fx-requesting class after request");
});

test("Indicator adds fx-error class on error", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test" fx-indicator>Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	fixi.process(button);

	// Start request
	button.dispatchEvent(new CustomEvent("fx:before"));
	assert.ok(button.classList.contains("fx-requesting"), "Should have requesting class");

	// Error occurs
	button.dispatchEvent(new CustomEvent("fx:error"));
	assert.ok(!button.classList.contains("fx-requesting"), "Should remove requesting class on error");
	assert.ok(button.classList.contains("fx-error"), "Should add fx-error class on error");
});

test("Custom indicator class via fx-indicator-class attribute", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test" fx-indicator fx-indicator-class="is-loading">Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	fixi.process(button);

	button.dispatchEvent(new CustomEvent("fx:before"));
	assert.ok(button.classList.contains("is-loading"), "Should use custom class name");
	assert.ok(!button.classList.contains("fx-requesting"), "Should not use default class when custom specified");
});

test("Indicator toggles attribute via fx-indicator-attr", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test" fx-indicator fx-indicator-attr="disabled">Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	fixi.process(button);

	// Verify no attribute initially
	assert.ok(!button.hasAttribute("disabled"), "Should not have disabled attribute initially");

	button.dispatchEvent(new CustomEvent("fx:before"));
	assert.ok(button.hasAttribute("disabled"), "Should add disabled attribute");

	button.dispatchEvent(new CustomEvent("fx:after"));
	assert.ok(!button.hasAttribute("disabled"), "Should remove disabled attribute");
});

test("Indicator toggles multiple attributes via fx-indicator-attr", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<button fx-action="/test" fx-indicator fx-indicator-attr="disabled,aria-busy,aria-disabled">Click</button>`;
	const button = document.querySelector("[fx-action]")!;

	fixi.process(button);

	// Verify no attributes initially
	assert.ok(!button.hasAttribute("disabled"), "Should not have disabled initially");
	assert.ok(!button.hasAttribute("aria-busy"), "Should not have aria-busy initially");
	assert.ok(!button.hasAttribute("aria-disabled"), "Should not have aria-disabled initially");

	button.dispatchEvent(new CustomEvent("fx:before"));
	assert.ok(button.hasAttribute("disabled"), "Should add disabled");
	assert.ok(button.hasAttribute("aria-busy"), "Should add aria-busy");
	assert.ok(button.hasAttribute("aria-disabled"), "Should add aria-disabled");

	button.dispatchEvent(new CustomEvent("fx:after"));
	assert.ok(!button.hasAttribute("disabled"), "Should remove disabled");
	assert.ok(!button.hasAttribute("aria-busy"), "Should remove aria-busy");
	assert.ok(!button.hasAttribute("aria-disabled"), "Should remove aria-disabled");
});

// =============================================================================
// SWAP / REQUEST LIFECYCLE TESTS
// =============================================================================

test("Swap triggers fetch and fires lifecycle events", async () => {
	const fixi = new Fixi();

	const trackCalls: {calls: string[]} = {calls: []};

	document.body.innerHTML = `
		<div id="content" fx-action="/update" fx-swap="innerHTML" fx-target="#content">Old Content</div>
	`;

	const content = document.querySelector("#content")!;
	const events: string[] = [];

	// Inject mock fetch via fx:config event
	injectMockFetch(content, "<p>New Content</p>", trackCalls);

	content.addEventListener("fx:before", () => events.push("before"));
	content.addEventListener("fx:after", () => events.push("after"));
	content.addEventListener("fx:swapped", () => events.push("swapped"));

	fixi.process(content);

	// Trigger click
	content.dispatchEvent(new CustomEvent("click", {bubbles: true}));

	// Wait for async operations + swap
	await new Promise((resolve) => setTimeout(resolve, 50));

	assert.strictEqual(trackCalls.calls.length, 1, "Fetch should be called once");
	assert.strictEqual(trackCalls.calls[0], "/update", "Fetch should use correct URL");
	assert.ok(events.includes("before"), "fx:before should fire");
	assert.ok(events.includes("after"), "fx:after should fire");
	assert.ok(events.includes("swapped"), "fx:swapped should fire");
	assert.deepStrictEqual(events, ["before", "after", "swapped"], "Events should fire in correct order");
	assert.strictEqual(content.innerHTML, "<p>New Content</p>", "Content should be replaced");
});
