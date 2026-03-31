import * as http from "http";
import type {IncomingMessage, ServerResponse} from "http";

const PORT = 3001;

// Define routes using simple URL strings
// Supports:
// - Static routes: "/api/test"
// - Dynamic parameters: "/api/user/:id" (converts to URLPattern syntax)
const routes: Route[] = [
	{
		url: "/api/test",
		handler: () => ({
			status: 200,
			body: "<p>Hello from Fixi API!</p>",
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/like",
		handler: () => ({
			status: 200,
			body: "<p>Liked! Total: 42</p>",
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/user/:id",
		handler: (match: URLPatternResult | null) => ({
			status: 200,
			body: `<p>User ID: ${match?.pathname.groups.id}</p>`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/delay",
		handler: async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return {
				status: 200,
				body: "<p>Delayed response (1s)</p>",
				headers: {"Content-Type": "text/html"}
			};
		}
	},
	{
		url: "/api/animation/slide",
		handler: () => ({
			status: 200,
			body: `
				<h4 style="margin: 0 0 0.5rem 0">🌊 Slide In</h4>
				<p style="margin: 0; opacity: 0.9">Content slides in smoothly from the side.</p>
			`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/animation/zoom",
		handler: () => ({
			status: 200,
			body: `
				<h4 style="margin: 0 0 0.5rem 0">🔍 Zoom Scale</h4>
				<p style="margin: 0; opacity: 0.9">Content zooms in with a smooth scale effect.</p>
			`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/animation/flip",
		handler: () => ({
			status: 200,
			body: `
				<h4 style="margin: 0 0 0.5rem 0">🔄 3D Flip</h4>
				<p style="margin: 0; opacity: 0.9">Content flips in with a 3D rotation effect.</p>
			`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/animation/blur",
		handler: () => ({
			status: 200,
			body: `
				<h4 style="margin: 0 0 0.5rem 0">🌫️ Blur Fade</h4>
				<p style="margin: 0; opacity: 0.9">Content fades in with a soft blur effect.</p>
			`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/animation/fade",
		handler: () => ({
			status: 200,
			body: `
				<h4 style="margin: 0 0 0.5rem 0">✨ Simple Fade</h4>
				<p style="margin: 0; opacity: 0.9">Clean opacity fade transition.</p>
			`,
			headers: {"Content-Type": "text/html"}
		})
	},
	{
		url: "/api/users",
		handler: async (match: URLPatternResult | null, req?: IncomingMessage) => {
			// Add natural delay (300-800ms) to simulate real network
			await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
			
			const reqUrl = new URL(req?.url || "/", `http://${req?.headers.host || "localhost"}`);
			const page = parseInt(reqUrl.searchParams.get("page") || "1", 10);
			const limit = 10;
			const start = (page - 1) * limit;
			
			// Generate fake user data
			const users = [];
			const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
			const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
			
			for (let i = 0; i < limit; i++) {
				const id = start + i + 1;
				const firstName = firstNames[(start + i) % firstNames.length];
				const lastName = lastNames[(start + i) % lastNames.length];
				const name = `${firstName} ${lastName}`;
				const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@example.com`;
				const avatarColor = `hsl(${(id * 137.5) % 360}, 70%, 60%)`;
				
				users.push({
					id,
					name,
					email,
					avatarColor,
					initials: `${firstName[0]}${lastName[0]}`
				});
			}
			
			// Generate HTML for users
			const usersHtml = users.map(user => `
				<div class="user-card" style="
					display: flex;
					align-items: center;
					padding: 1rem;
					margin-bottom: 0.5rem;
					background: white;
					border-radius: 8px;
					border: 1px solid #e0e0e0;
					animation: fade-in-up 0.3s ease-out;
				">
					<div class="user-avatar" style="
						width: 48px;
						height: 48px;
						border-radius: 50%;
						background: ${user.avatarColor};
						display: flex;
						align-items: center;
						justify-content: center;
						color: white;
						font-weight: bold;
						font-size: 1.2rem;
						margin-right: 1rem;
						flex-shrink: 0;
					">
						${user.initials}
					</div>
					<div class="user-info" style="flex: 1; min-width: 0;">
						<div class="user-name" style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">
							${user.name}
						</div>
						<div class="user-email" style="color: #666; font-size: 0.9rem;">
							${user.email}
						</div>
					</div>
					<div class="user-id" style="color: #999; font-size: 0.85rem;">
						#${user.id}
					</div>
				</div>
			`).join("");
			
			// Determine if there are more pages (max 5 pages for demo)
			const hasMore = page < 5;
			const nextPage = hasMore ? page + 1 : null;
			
			// Generate loader HTML (will replace the old loader with outerHTML swap)
			const loaderHtml = hasMore ? `
				<div 
					class="user-batch infinite-loader" 
					fx-action="/api/users?page=${nextPage}"
					fx-target="this"
					fx-swap="outerHTML"
					fx-trigger="intersect"
					fx-intersect-threshold="0"
					fx-intersect-root-margin="100px"
				>
					<div class="spinner" style="
						width: 24px;
						height: 24px;
						border: 3px solid #e0e0e0;
						border-top-color: #0066cc;
						border-radius: 50%;
						animation: spin 1s linear infinite;
						display: inline-block;
						vertical-align: middle;
						margin-right: 0.5rem;
					"></div>
					<span style="vertical-align: middle;">Loading more users...</span>
				</div>
			` : `
				<div class="infinite-end" style="
					text-align: center;
					padding: 2rem;
					color: #999;
				">
					✨ You've reached the end!
				</div>
			`;
			
			return {
				status: 200,
				body: `<div class="user-batch">${usersHtml}${loaderHtml}</div>`,
				headers: {"Content-Type": "text/html"}
			};
		}
	}
];

const compiledRoutes = routes.map((route) => {
	return {
		pattern: new URLPattern({pathname: route.url}),
		handler: route.handler,
		url: route.url
	};
});

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, FX-Request");

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	const url = new URL(req.url || "/", `http://${req.headers.host}`);

	// Find matching route
	for (const route of compiledRoutes) {
		const match = route.pattern.exec(url);
		if (match) {
			try {
				const result = await route.handler(match, req);
				res.writeHead(result.status, result.headers);
				res.end(result.body);
				console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname} -> 200`);
				return;
			} catch (error) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.end("Internal Server Error");
				console.error(`[${new Date().toISOString()}] ${req.method} ${url.pathname} -> 500`, error);
				return;
			}
		}
	}

	// 404 for unmatched routes
	res.writeHead(404, {"Content-Type": "text/plain"});
	res.end("Not Found");
	console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname} -> 404`);
});

server.listen(PORT, () => {
	console.log(`🚀 Mock API server running at http://localhost:${PORT}`);
	console.log(`📡 Available endpoints:`);
	routes.forEach((route) => {
		console.log(`   ${route.url}`);
	});
	console.log(`\n✨ Server is watching for changes (restart on file change)`);
});

// Route handler type
interface Route {
	url: string;
	handler: (match: URLPatternResult | null, req?: IncomingMessage) =>
		| Promise<{
				status: number;
				body: string;
				headers: Record<string, string>;
		  }>
		| {
				status: number;
				body: string;
				headers: Record<string, string>;
		  };
}
