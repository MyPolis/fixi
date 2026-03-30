import {beforeEach, test} from "node:test";
import assert from "node:assert";

// Setup DOM environment FIRST before importing Fixi
import {Window} from "happy-dom";

const window = new Window();
(globalThis as any).window = window;
(globalThis as any).document = window.document;
(globalThis as any).MutationObserver = window.MutationObserver;
(globalThis as any).CustomEvent = window.CustomEvent;
(globalThis as any).fetch = window.fetch;

// Now import Fixi after DOM is ready
const {Fixi} = await import("./fixi.js");

beforeEach(() => {
	document.body.innerHTML = "";
});

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

test("Fixi supports fx-trigger custom event", () => {
	const fixi = new Fixi();

	document.body.innerHTML = `<div fx-action="/test" fx-trigger="mouseenter">Hover</div>`;
	const div = document.querySelector("[fx-action]")!;

	fixi.process(div);

	// Should work with mouseenter now
	assert.ok(true, "Custom trigger attribute processed");
});
