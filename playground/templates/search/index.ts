import {html} from "../html.js";

// Sample search data (using same pool as items for consistency)
const searchData = [
	{ id: 1, title: "Project Alpha", description: "High priority feature for Q1", category: "Project" },
	{ id: 2, title: "Dashboard Component", description: "Performance optimization required", category: "Component" },
	{ id: 3, title: "API Integration", description: "Integration with third-party API", category: "Integration" },
	{ id: 4, title: "Database Migration", description: "Migrate legacy data to new schema", category: "Database" },
	{ id: 5, title: "User Authentication", description: "OAuth2 and JWT implementation", category: "Security" },
	{ id: 6, title: "Payment Gateway", description: "Stripe and PayPal support", category: "Payment" },
	{ id: 7, title: "Notification System", description: "Push and email notifications", category: "System" },
	{ id: 8, title: "Analytics Module", description: "Real-time metrics dashboard", category: "Analytics" },
	{ id: 9, title: "Search Index", description: "Elasticsearch integration", category: "Search" },
	{ id: 10, title: "Cache Layer", description: "Redis caching strategy", category: "Cache" },
	{ id: 11, title: "Queue Processor", description: "Background job processing", category: "Queue" },
	{ id: 12, title: "Webhook Handler", description: "Event-driven architecture", category: "Webhook" },
	{ id: 13, title: "Report Generator", description: "Scheduled report generation", category: "Report" },
	{ id: 14, title: "Export Service", description: "CSV and Excel export", category: "Export" },
	{ id: 15, title: "Import Pipeline", description: "Batch import from external sources", category: "Import" },
	{ id: 16, title: "Email Service", description: "Transactional email templates", category: "Email" },
	{ id: 17, title: "File Storage", description: "S3-compatible storage", category: "Storage" },
	{ id: 18, title: "Image Resizer", description: "On-the-fly image processing", category: "Image" },
	{ id: 19, title: "PDF Generator", description: "HTML to PDF conversion", category: "PDF" },
	{ id: 20, title: "Chat System", description: "WebSocket-based messaging", category: "Chat" }
];

export interface SearchResult {
	id: number;
	title: string;
	description: string;
	category: string;
}

// Search function with highlighting
export function searchItems(query: string, limit: number = 20): SearchResult[] {
	const normalizedQuery = query.toLowerCase().trim();
	
	if (!normalizedQuery) {
		return searchData;
	}
	
	return searchData
		.filter(item => 
			item.title.toLowerCase().includes(normalizedQuery) ||
			item.description.toLowerCase().includes(normalizedQuery) ||
			item.category.toLowerCase().includes(normalizedQuery)
		)
		.slice(0, limit);
}

// Highlight matching text with bold
function highlightText(text: string, query: string): string {
	if (!query.trim()) return text;
	
	const normalizedQuery = query.toLowerCase();
	const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, 'gi');
	return text.replace(regex, '<b>$1</b>');
}

// Escape special regex characters
function escapeRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Render single search result
export function renderSearchResult(item: SearchResult, query: string): string {
	const highlightedTitle = highlightText(item.title, query);
	const highlightedDesc = highlightText(item.description, query);
	
	return html`
		<div class="search-result" style="
			display: flex;
			align-items: flex-start;
			padding: 1rem;
			margin-bottom: 0.75rem;
			background: white;
			border-radius: 8px;
			border: 1px solid #e0e0e0;
			transition: all 0.2s;
			cursor: pointer;
		" onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#0066cc';" 
			onmouseout="this.style.background='white'; this.style.borderColor='#e0e0e0';">
			<div class="result-icon" style="
				width: 40px;
				height: 40px;
				border-radius: 8px;
				background: linear-gradient(135deg, #0066cc, #0052a3);
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				font-size: 0.9rem;
				margin-right: 1rem;
				flex-shrink: 0;
			">
				${item.category[0]}
			</div>
			<div class="result-content" style="flex: 1; min-width: 0;">
				<div class="result-title" style="font-weight: 600; color: #333; margin-bottom: 0.25rem; font-size: 1rem;">
					${highlightedTitle}
				</div>
				<div class="result-description" style="color: #666; font-size: 0.9rem; margin-bottom: 0.25rem;">
					${highlightedDesc}
				</div>
				<div class="result-category" style="
					display: inline-block;
					background: #e8f0fe;
					color: #0066cc;
					padding: 0.15rem 0.5rem;
					border-radius: 12px;
					font-size: 0.75rem;
					font-weight: 500;
				">
					${item.category}
				</div>
			</div>
		</div>
	`;
}

// Render search results container
export function renderSearchResults(query: string): string {
	const results = searchItems(query, 5);
	
	if (results.length === 0) {
		return html`
			<div class="search-empty" style="
				text-align: center;
				padding: 3rem 2rem;
				color: #666;
			">
				<div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
				<div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem;">No results found</div>
				<div style="font-size: 0.9rem;">Try a different search term</div>
			</div>
		`;
	}
	
	const resultsHtml = results.map(item => renderSearchResult(item, query)).join("");
	
	return html`
		<div class="search-results-list">
			${resultsHtml}
		</div>
		<div class="search-meta" style="
			text-align: center;
			padding: 1rem;
			color: #999;
			font-size: 0.85rem;
		">
			Showing ${results.length} of ${searchData.length} items
		</div>
	`;
}

// Render the complete response with info
export function createSearchResponse(query: string): string {
	const resultsHtml = renderSearchResults(query);
	
	return html`
		<div class="search-results-container">
			${resultsHtml}
		</div>
	`;
}

// Render skeleton loading state
export function renderSkeletonLoader(count: number = 5): string {
	const skeletonItems = Array(count).fill(0).map(() => html`
		<div class="skeleton-result" style="
			display: flex;
			align-items: flex-start;
			padding: 1rem;
			margin-bottom: 0.75rem;
			background: white;
			border-radius: 8px;
			border: 1px solid #e0e0e0;
		">
			<div class="skeleton-icon" style="
				width: 40px;
				height: 40px;
				border-radius: 8px;
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: shimmer 1.5s infinite;
				margin-right: 1rem;
				flex-shrink: 0;
			"></div>
			<div class="skeleton-content" style="flex: 1; min-width: 0;">
				<div class="skeleton-title" style="
					height: 1rem;
					width: 60%;
					background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
					background-size: 200% 100%;
					animation: shimmer 1.5s infinite;
					border-radius: 4px;
					margin-bottom: 0.5rem;
				"></div>
				<div class="skeleton-desc" style="
					height: 0.875rem;
					width: 80%;
					background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
					background-size: 200% 100%;
					animation: shimmer 1.5s infinite;
					border-radius: 4px;
				"></div>
			</div>
		</div>
	`).join("");
	
	return html`
		<div class="skeleton-container">
			${skeletonItems}
		</div>
	`;
}
