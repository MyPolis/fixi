// Helper to create a mock fetch that returns a text response
export function mockFetch(response: string, trackCalls?: {calls: string[]}) {
	return async (url: string) => {
		if (trackCalls) {
			trackCalls.calls.push(url);
		}
		return {
			text: async () => response
		};
	};
}
