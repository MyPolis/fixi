# @mypolis.eu/fixi

A lightweight, modern fork of [fixi](https://github.com/bigskysoftware/fixi) - progressive enhancement for HTML with declarative AJAX.

## Installation

```bash
npm install @mypolis.eu/fixi
```

## Basic Usage

Import the library and it automatically enhances your HTML:

```javascript
import "@mypolis.eu/fixi/core";
```

Then add `fx-*` attributes to your HTML:

```html
<button
	fx-action="/api/like"
	fx-target="#likes"
	fx-swap="innerHTML"
>
	Like
</button>

<div id="likes">0 likes</div>
```

## Core Attributes

### `fx-action` (required)

The URL to fetch when triggered.

```html
<button fx-action="/api/data">Load Data</button>
```

### `fx-target`

CSS selector for the element to update. Defaults to the element itself.

```html
<button
	fx-action="/api/update"
	fx-target="#result"
>
	Update
</button>
<div id="result">Old content</div>
```

### `fx-swap`

How to swap the content. Options: `innerHTML`, `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `none`, or a custom function.

```html
<!-- Replace inner content -->
<div
	fx-action="/api/content"
	fx-swap="innerHTML"
>
	Loading...
</div>

<!-- Replace entire element -->
<div
	fx-action="/api/card"
	fx-swap="outerHTML"
>
	Loading...
</div>

<!-- Insert adjacent HTML -->
<div
	fx-action="/api/item"
	fx-swap="beforeend"
>
	Items:
</div>
```

### `fx-trigger`

Event that triggers the action. Defaults: `click` (button/div), `submit` (form), `change` (input/select/textarea).

```html
<!-- Trigger on hover -->
<div
	fx-action="/api/preview"
	fx-trigger="mouseenter"
>
	Hover me
</div>

<!-- Trigger on intersection (lazy loading) -->
<div
	fx-action="/api/lazy"
	fx-trigger="intersect"
>
	Load when visible
</div>

<!-- Custom threshold and root margin for intersection -->
<div
	fx-action="/api/lazy"
	fx-trigger="intersect"
	fx-intersect-threshold="0.5"
	fx-intersect-root-margin="100px"
>
	Load when 50% visible with 100px margin
</div>
```

### `fx-method`

HTTP method. Default: `GET`

```html
<form
	fx-action="/api/create"
	fx-method="POST"
>
	<input name="title" />
	<button type="submit">Create</button>
</form>
```

### `fx-indicator`

Show loading state during requests.

```html
<!-- Toggle fx-requesting class on the button -->
<button
	fx-action="/api/save"
	fx-indicator
>
	Save
</button>

<!-- Toggle custom class -->
<button
	fx-action="/api/save"
	fx-indicator
	fx-indicator-class="is-loading"
>
	Save
</button>

<!-- Toggle multiple attributes for accessibility -->
<button
	fx-action="/api/save"
	fx-indicator
	fx-indicator-attr="disabled,aria-busy,aria-disabled"
>
	Save
</button>

<!-- Use external indicator element -->
<button
	fx-action="/api/save"
	fx-indicator="#spinner"
>
	Save
</button>
<span
	id="spinner"
	class="hidden"
	>Loading...</span
>
```

## Events

The library dispatches events throughout the request lifecycle:

### `fx:init` / `fx:inited`

Fired when an element is first processed.

```javascript
document.addEventListener("fx:init", (e) => {
	console.log("Element initialized:", e.target);
});
```

### `fx:config`

Intercept and modify configuration before the request.

```javascript
element.addEventListener("fx:config", (e) => {
	// Add custom headers
	e.cfg.headers["X-Custom"] = "value";
	// Use custom fetch
	e.cfg.fetch = myCustomFetch;
});
```

### `fx:before`

Fired before the request starts. Cancelable.

```javascript
element.addEventListener("fx:before", (e) => {
	if (!confirm("Are you sure?")) {
		e.preventDefault(); // Cancel the request
	}
});
```

### `fx:after`

Fired after successful response. Cancelable.

```javascript
element.addEventListener("fx:after", (e) => {
	console.log("Response received:", e.cfg.text);
});
```

### `fx:swapped`

Fired after DOM has been updated.

```javascript
element.addEventListener("fx:swapped", (e) => {
	// Re-initialize any JS that depends on the new DOM
	initTooltips();
});
```

### `fx:error`

Fired when request fails.

```javascript
element.addEventListener("fx:error", (e) => {
	console.error("Request failed:", e.cfg.error);
});
```

### `fx:finally`

Always fired after request completes (success or error).

## Advanced Usage

### Manual Processing

If you add elements dynamically, manually trigger processing:

```javascript
import {fixi} from "@mypolis.eu/fixi/core";

// After adding new element to DOM
const newElement = document.createElement("div");
newElement.setAttribute("fx-action", "/api/data");
document.body.appendChild(newElement);
fixi.process(newElement);
```

### Custom Swap Function

```html
<script>
	element.addEventListener("fx:config", (e) => {
		e.cfg.swap = async (cfg) => {
			// Custom logic to handle the response
			const data = JSON.parse(cfg.text);
			cfg.target.innerHTML = renderTemplate(data);
		};
	});
</script>
```

### View Transitions

The library automatically uses `document.startViewTransition` when available:

```javascript
// Check if browser supports view transitions
if (document.startViewTransition) {
	console.log("Smooth transitions enabled!");
}
```

## Ignoring Elements

Use `fx-ignore` to prevent processing of child elements:

```html
<div fx-ignore>
	<button fx-action="/api/ignored">This won't be enhanced</button>
</div>
```

## TypeScript Support

Global event types are automatically available when importing:

```typescript
import type {FxConfigEvent, FxBeforeEvent, FxAfterEvent} from "@mypolis.eu/fixi/core";

element.addEventListener("fx:config", (e: FxConfigEvent) => {
	e.cfg.fetch = customFetch;
});
```

## Configuration Interface

```typescript
interface FixiConfig {
	trigger: Event; // The triggering event
	action: string; // URL to fetch
	method: string; // HTTP method
	target: Element; // Element to update
	swap: string | Function; // Swap strategy
	body: FormData | null; // Request body
	headers: Record<string, string>;
	fetch: typeof fetch; // Fetch function to use
	confirm?: () => Promise<boolean>;
	// ... more options
}
```

## Browser Support

| Browser | Version | Year |
| ------- | ------- | ---- |
| Chrome  | 74+     | 2019 |
| Firefox | 90+     | 2021 |
| Safari  | 14.1+   | 2021 |
| Edge    | 79+     | 2020 |

All modern browsers supporting ES2022.

**Note:** View Transitions (for smooth animations) require Chrome 111+, but the library works perfectly without them in older browsers.

## License

MIT - Based on [fixi](https://github.com/bigskysoftware/fixi) by Big Sky Software
