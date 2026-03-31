import * as http from "http";
import type {ServerResponse} from "http";
import {createItemBatch} from "./templates/items/index.js";
import {createSearchResponse} from "./templates/search/index.js";

const PORT = 3001;

// Extended request type with injected parsed URL and match
type Request = Omit<http.IncomingMessage, "url"> & {
	url: URL;
	match: URLPatternResult;
};

// Route handler response type
interface HandlerResponse {
	status: number;
	body: string;
	headers: Record<string, string>;
}

// Route handler type - receives the extended request with url and match
interface Handler {
	(req: Request): Promise<HandlerResponse> | HandlerResponse;
}

// Route definition
interface Route {
	url: string;
	handler: Handler;
}

// Define routes
const routes: Route[] = [
	{
		url: "/api/items",
		handler: async (req) => {
			// Add natural delay (300-800ms) to simulate real network
			await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

			const page = parseInt(req.url.searchParams.get("page") || "1", 10);

			return {
				status: 200,
				body: createItemBatch(page, 5, 5),
				headers: {"Content-Type": "text/html"}
			};
		}
	},
	{
		url: "/api/search",
		handler: async (req) => {
			// Add small delay to simulate network and show loading state
			await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

			const query = req.url.searchParams.get("q") || "";

			return {
				status: 200,
				body: createSearchResponse(query),
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

const server = http.createServer(async (req: http.IncomingMessage, res: ServerResponse) => {
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
				// Extend the request with parsed URL and match
				const extendedReq = req as unknown as Request;
				extendedReq.url = url;
				extendedReq.match = match;

				const result = await route.handler(extendedReq);
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
