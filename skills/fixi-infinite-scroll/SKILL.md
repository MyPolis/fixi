---
name: fixi-infinite-scroll
description: Implement infinite scroll using fx-trigger="intersect" with declarative loader replacement. Server must return content + next loader HTML.
---

## Pattern Overview

The idiomatic fixi infinite scroll uses a self-replacing loader pattern:

1. **Trigger**: `fx-trigger="intersect"` - Loader triggers when scrolled into view
2. **Swap**: `fx-swap="outerHTML"` - Loader replaces itself entirely (no DOM duplication)
3. **Target**: `fx-target="this"` - The loader element is the target
4. **Content**: Server returns content items + next loader HTML

## Server Contract (Validation Rules)

⚠️ **The server response MUST include:**

1. **Content items** - The actual data to display
2. **Next loader HTML** OR **End state element** when complete

The loader HTML in the response MUST have these exact attributes:
- `fx-action` with updated pagination (e.g., `?page=2`)
- `fx-target="this"`
- `fx-swap="outerHTML"`
- `fx-trigger="intersect"`

**⚠️ FLAG THESE ISSUES:**
- Server returns only content without a loader → infinite scroll breaks after first load
- Using `innerHTML` swap → duplicates loaders, breaks scroll
- Missing pagination in `fx-action` → loads same page repeatedly
- Loader missing required attributes → intersection observer won't attach

## HTML Structure

```html
<!-- Scrollable container -->
<div id="user-list" style="max-height: 500px; overflow-y: auto;">
  <!-- Items will be inserted here -->
  
  <!-- Initial loader - triggers on scroll into view -->
  <div
    class="loader"
    fx-action="/api/users?page=1"
    fx-target="this"
    fx-swap="outerHTML"
    fx-trigger="intersect"
    fx-intersect-threshold="0"
    fx-intersect-root-margin="50px"
  >
    <span>Loading...</span>
  </div>
</div>
```

## Expected Server Response

### With More Data Available:
```html
<!-- User items -->
<div class="user-card">...</div>
<div class="user-card">...</div>
<!-- ...more items... -->

<!-- Next loader (replaces current loader) -->
<div
  class="loader"
  fx-action="/api/users?page=2"
  fx-target="this"
  fx-swap="outerHTML"
  fx-trigger="intersect"
>
  <span>Loading more...</span>
</div>
```

### When No More Data (End of List):
```html
<!-- Final items -->
<div class="user-card">...</div>

<!-- End marker (replaces loader) -->
<div class="end-message">No more items</div>
```

## Why `outerHTML`?

The loader uses `outerHTML` swap to **replace itself entirely**. This is critical:

- `outerHTML` → Loader is removed, new content takes its place ✅
- `innerHTML` → Loader stays, content appended inside ❌ (creates nested loaders)

## Complete Example

### Client-side:
```html
<script type="module">
  import "@mypolis.eu/fixi/core";
</script>

<div id="feed" style="max-height: 80vh; overflow-y: auto;">
  <div
    class="infinite-loader"
    fx-action="/api/posts?page=1"
    fx-target="this"
    fx-swap="outerHTML"
    fx-trigger="intersect"
    fx-intersect-threshold="0.1"
  >
    Loading posts...
  </div>
</div>
```

### Server-side Response (conceptual):
```
POST /api/posts?page=1

Response:
<article>Post 1 content...</article>
<article>Post 2 content...</article>
<div 
  class="infinite-loader" 
  fx-action="/api/posts?page=2"
  fx-target="this"
  fx-swap="outerHTML"
  fx-trigger="intersect"
>
  Loading more posts...
</div>
```

## Anti-patterns to Avoid

❌ **Wrong: Using `innerHTML` swap**
```html
<div fx-swap="innerHTML">...</div>  <!-- Duplicates loaders! -->
```

❌ **Wrong: Loader as separate element**
```html
<div id="items"></div>  <!-- ← Wrong: separate target -->
<div fx-target="#items" fx-swap="innerHTML">...</div>
```

❌ **Wrong: Server returns only content**
```html
<!-- Server returns this ONLY: -->
<div class="item">...</div>
<!-- Missing: Next loader! Scroll stops working -->
```

❌ **Wrong: Static loader URL**
```html
<div fx-action="/api/items">...</div>  <!-- No pagination! -->
```

## Optional Intersection Settings

Fine-tune when the loader triggers:

- `fx-intersect-threshold="0.5"` - Trigger when 50% visible
- `fx-intersect-root-margin="100px"` - Trigger 100px before entering viewport

## When to Use This Pattern

✅ Infinite scrolling feeds (social media, news)
✅ Paginated lists without page reloads
✅ Lazy loading large datasets

❌ Don't use for: Small lists (< 20 items), static content, pagination with numbered pages
