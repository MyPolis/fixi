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
				const result = await route.handler(match);
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
	handler: (match: URLPatternResult | null) =>
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
