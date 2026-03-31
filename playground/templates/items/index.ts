import {html} from "../html.js";

// Item data structure
export interface Item {
	id: number;
	title: string;
	description: string;
	avatarColor: string;
	initials: string;
}

// Sample data for generating items
const itemTitles = [
	"Project Alpha",
	"Dashboard Component",
	"API Integration",
	"Database Migration",
	"User Authentication",
	"Payment Gateway",
	"Notification System",
	"Analytics Module",
	"Search Index",
	"Cache Layer",
	"Queue Processor",
	"Webhook Handler",
	"Report Generator",
	"Export Service",
	"Import Pipeline",
	"Email Service",
	"File Storage",
	"Image Resizer",
	"PDF Generator",
	"Chat System"
];

const itemDescriptions = [
	"High priority feature for Q1",
	"Performance optimization required",
	"Integration with third-party API",
	"Migrate legacy data to new schema",
	"OAuth2 and JWT implementation",
	"Stripe and PayPal support",
	"Push and email notifications",
	"Real-time metrics dashboard",
	"Elasticsearch integration",
	"Redis caching strategy",
	"Background job processing",
	"Event-driven architecture",
	"Scheduled report generation",
	"CSV and Excel export",
	"Batch import from external sources",
	"Transactional email templates",
	"S3-compatible storage",
	"On-the-fly image processing",
	"HTML to PDF conversion",
	"WebSocket-based messaging"
];

// Factory function to generate a single item
export function createItem(id: number): Item {
	const titleIndex = (id - 1) % itemTitles.length;
	const descIndex = (id - 1) % itemDescriptions.length;
	const title = itemTitles[titleIndex];
	const description = itemDescriptions[descIndex];
	const avatarColor = `hsl(${(id * 137.5) % 360}, 70%, 60%)`;
	const initials = title
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return {
		id,
		title,
		description,
		avatarColor,
		initials
	};
}

// Factory function to generate a batch of items
export function createItems(page: number, limit: number = 10): Item[] {
	const start = (page - 1) * limit;
	const items: Item[] = [];

	for (let i = 0; i < limit; i++) {
		const id = start + i + 1;
		items.push(createItem(id));
	}

	return items;
}

// Factory function to generate the full infinite scroll response
export function createItemBatch(page: number, limit: number = 10, maxPages: number = 5): string {
	const items = createItems(page, limit);
	const itemsHtml = items.map((item) => renderItemCard(item)).join("");

	const hasMore = page < maxPages;
	const nextPage = hasMore ? page + 1 : null;
	const loaderHtml = hasMore ? renderLoader(nextPage!) : renderEnd();

	return html`<div class="item-batch">${itemsHtml}${loaderHtml}</div>`;
}

// Template functions
export function renderItemCard(item: Item): string {
	return html`
		<div
			class="item-card"
			style="
			display: flex;
			align-items: center;
			padding: 1rem;
			margin-bottom: 0.75rem;
			background: white;
			border-radius: 8px;
			border: 1px solid #e0e0e0;
			animation: fade-in-up 0.3s ease-out;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		"
		>
			<div
				class="item-avatar"
				style="
				width: 48px;
				height: 48px;
				border-radius: 50%;
				background: ${item.avatarColor};
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				font-size: 1.2rem;
				margin-right: 1rem;
				flex-shrink: 0;
			"
			>
				${item.initials}
			</div>
			<div
				class="item-info"
				style="flex: 1; min-width: 0;"
			>
				<div
					class="item-title"
					style="font-weight: 600; color: #333; margin-bottom: 0.25rem;"
				>
					${item.title}
				</div>
				<div
					class="item-description"
					style="color: #666; font-size: 0.9rem;"
				>
					${item.description}
				</div>
			</div>
			<div
				class="item-id"
				style="color: #999; font-size: 0.85rem;"
			>
				#${item.id}
			</div>
		</div>
	`;
}

export function renderLoader(nextPage: number): string {
	return html`
		<div
			class="item-batch infinite-loader"
			fx-action="/api/items?page=${nextPage}"
			fx-target="this"
			fx-swap="outerHTML"
			fx-trigger="intersect"
			fx-intersect-threshold="0"
			fx-intersect-root-margin="100px"
		>
			<div
				class="spinner"
				style="
				width: 24px;
				height: 24px;
				border: 3px solid #e0e0e0;
				border-top-color: #0066cc;
				border-radius: 50%;
				animation: spin 1s linear infinite;
				display: inline-block;
				vertical-align: middle;
				margin-right: 0.5rem;
			"
			></div>
			<span style="vertical-align: middle;">Loading more items...</span>
		</div>
	`;
}

export function renderEnd(): string {
	return html`
		<div
			class="infinite-end"
			style="
			text-align: center;
			padding: 2rem;
			color: #999;
		"
		>
			✨ You've reached the end!
		</div>
	`;
}
